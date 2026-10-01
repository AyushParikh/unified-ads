import { NextResponse } from "next/server";
import { enums, ResourceNames, resources, MutateOperation } from "google-ads-api";
import { getCustomer, describeError } from "@/lib/ads";
import { validate, type AdInput } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const input = (await req.json()) as AdInput;
  const problems = validate(input);
  if (problems.length) {
    return NextResponse.json({ errors: problems.map((message) => ({ message })) }, { status: 400 });
  }

  try {
    const { customer, customerId } = getCustomer();

    // Resolve the location name to a geo target constant.
    const geo = await customer.geoTargetConstants.suggestGeoTargetConstants({
      locale: "en",
      location_names: { names: [input.location.trim()] },
    } as never);
    console.log("[create-ad] geo suggestions", JSON.stringify(geo));
    const geoConstant = geo.geo_target_constant_suggestions?.[0]?.geo_target_constant?.resource_name;
    if (!geoConstant) {
      return NextResponse.json(
        { errors: [{ field: "location", message: `Couldn't find a Google Ads location matching "${input.location}".` }] },
        { status: 400 },
      );
    }

    const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const name = `${input.businessName.trim()} – ${stamp}`;
    const budgetRn = ResourceNames.campaignBudget(customerId, -1);
    const campaignRn = ResourceNames.campaign(customerId, -2);
    const adGroupRn = ResourceNames.adGroup(customerId, -3);
    const micros = Math.round(input.dailyBudget * 100) * 10_000; // whole cents

    const ops: MutateOperation<
      | resources.ICampaignBudget
      | resources.ICampaign
      | resources.ICampaignCriterion
      | resources.IAdGroup
      | resources.IAdGroupCriterion
      | resources.IAdGroupAd
    >[] = [
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetRn,
          name,
          amount_micros: micros,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
          explicitly_shared: false,
        },
      },
      {
        entity: "campaign",
        operation: "create",
        resource: {
          resource_name: campaignRn,
          name,
          status: enums.CampaignStatus.PAUSED,
          advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
          campaign_budget: budgetRn,
          network_settings: {
            target_google_search: true,
            target_search_network: false,
            target_content_network: false,
            target_partner_search_network: false,
          },
          target_spend: {}, // Maximize Clicks
          contains_eu_political_advertising:
            enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
        },
      },
      {
        entity: "campaign_criterion",
        operation: "create",
        resource: { campaign: campaignRn, location: { geo_target_constant: geoConstant } },
      },
      {
        entity: "ad_group",
        operation: "create",
        resource: {
          resource_name: adGroupRn,
          name: `${input.businessName.trim()} – Ad group`,
          campaign: campaignRn,
          status: enums.AdGroupStatus.ENABLED,
          type: enums.AdGroupType.SEARCH_STANDARD,
        },
      },
      ...input.keywords.map((text) => ({
        entity: "ad_group_criterion" as const,
        operation: "create" as const,
        resource: {
          ad_group: adGroupRn,
          status: enums.AdGroupCriterionStatus.ENABLED,
          keyword: { text, match_type: enums.KeywordMatchType.BROAD },
        },
      })),
      {
        entity: "ad_group_ad",
        operation: "create",
        resource: {
          ad_group: adGroupRn,
          status: enums.AdGroupAdStatus.ENABLED,
          ad: {
            final_urls: [input.websiteUrl],
            responsive_search_ad: {
              headlines: input.headlines.map((text) => ({ text })),
              descriptions: input.descriptions.map((text) => ({ text })),
            },
          },
        },
      },
    ];

    console.log("[create-ad] request", JSON.stringify(ops, null, 2));
    // mutateResources is a single MutateGoogleAds call: all-or-nothing (no partial failure).
    const res = await customer.mutateResources(ops);
    console.log("[create-ad] response", JSON.stringify(res, null, 2));

    const campaignName = res.mutate_operation_responses?.[1]?.campaign_result?.resource_name;
    const campaignId = campaignName?.split("/").pop();
    if (!campaignId) throw new Error("Campaign was created but no ID was returned.");

    return NextResponse.json({
      campaignId,
      url: `https://ads.google.com/aw/adgroups?campaignId=${campaignId}&__e=${customerId}`,
    });
  } catch (err) {
    console.error("[create-ad] failed", err);
    return NextResponse.json({ errors: describeError(err) }, { status: 500 });
  }
}
