# Unified Ads campaign creator (PoC)

One "Create ad" button → short form → a **PAUSED** campaign is created on **Google Ads** or **Meta Ads**, chosen with a platform picker. No login, no database. Server-side only.

- **Google**: via the [`google-ads-api`](https://github.com/Opteo/google-ads-api) package (API v25). Everything is created in a single `mutateResources` call (one atomic `MutateGoogleAds` request — if any operation fails, nothing is created): budget → campaign (Maximize Clicks, Google Search only, EU political ads = "does not contain") → location → ad group → BROAD keywords → responsive search ad.
- **Meta**: via raw Graph API calls (v22.0). Campaign (OUTCOME_TRAFFIC) → ad set (daily budget, LINK_CLICKS, geo targeting on Facebook feed) → image upload (Meta fetches a public URL) → ad creative (link ad with page + call-to-action) → ad. Each step is a separate request; a mid-sequence failure leaves earlier pieces created but paused.

## Google Ads setup

1. **Developer token** – In your MCC: Tools → API Center. Copy the token. Test-level tokens only work on test accounts; apply for Basic access to use real accounts.
2. **OAuth client** – [Google Cloud Console](https://console.cloud.google.com/): create a project, enable **Google Ads API**, configure the OAuth consent screen (add yourself as a test user), then Credentials → Create **OAuth client ID** → type **Web application** with redirect URI `https://developers.google.com/oauthplayground`. Copy client ID and secret.
3. **Refresh token** (authorizing as the Google user that has access to your MCC):
   1. Open the [OAuth Playground](https://developers.google.com/oauthplayground).
   2. Gear icon → check **Use your own OAuth credentials** → paste client ID/secret.
   3. In Step 1 enter the scope `https://www.googleapis.com/auth/adwords` → Authorize APIs → sign in.
   4. Step 2 → **Exchange authorization code for tokens** → copy the **Refresh token**.
   (While the consent screen is in "Testing" mode, refresh tokens expire after 7 days — publish the app to avoid this.)
4. **IDs** – `GOOGLE_ADS_LOGIN_CUSTOMER_ID` is your MCC ID; `GOOGLE_ADS_CUSTOMER_ID` is the client account ID (linked under the MCC). Digits only, no dashes. The client account's currency should be **CAD**, since the budget is sent as-is.
5. `cp .env.example .env` and fill in the values.

## Meta Ads setup

1. **Meta app** – At [developers.facebook.com](https://developers.facebook.com), create an app of type **Business**. Add the **Marketing API** product.
2. **Access token** – Use a long-lived user token or a System User token (from Business Manager → Business settings → System Users). It must have **`ads_management`** permission and access to the ad account you want to use. For a quick PoC: Graph API Explorer → pick your app → add `ads_management` → generate token → extend to a long-lived token with the [access-token tool](https://developers.facebook.com/tools/debug/accesstoken/).
3. **Ad account ID** – In Ads Manager, top-left dropdown shows an ID like `1234567890`. Use it as `act_1234567890` (with the prefix).
4. **Page ID** – The Facebook Page the ads will run under. Found at Page → About → Page transparency, or via `/me/accounts` on the Graph API.
5. Fill `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID` in `.env`.

The daily budget is sent in the smallest currency unit of your ad account (cents for USD/CAD/EUR). The image URL you provide must be publicly reachable — Meta fetches it server-side and uploads it to your ad account.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

The full request/response of each attempt is logged in the terminal running `npm run dev`. API errors are returned to the UI with their field path (e.g. `operations[1].create.campaign.name`) and message.

## Notes

- Google: location is resolved with `GeoTargetConstantService.suggestGeoTargetConstants`; the first suggestion is used.
- Meta: location is resolved via Graph API `/search?type=adgeolocation` — tries country, then region, then city, and uses the first hit.
- The "Open in Google Ads" / "Open in Meta Ads Manager" link may ask you to pick the account if you're not already in it.
- Google: the ad group and ad are ENABLED, but the campaign is PAUSED, so nothing serves until you enable the campaign.
- Meta: the campaign, ad set, and ad are all PAUSED — enable the campaign in Ads Manager to start spend.
