# Google Ads campaign creator (PoC)

One "Create ad" button → short form → a **PAUSED** Search campaign is created in a client account under your manager (MCC) account. No login, no database. Server-side only, via the [`google-ads-api`](https://github.com/Opteo/google-ads-api) package (Google Ads API v25).

Everything is created in a single `mutateResources` call (one atomic `MutateGoogleAds` request — if any operation fails, nothing is created): budget → campaign (Maximize Clicks, Google Search only, EU political ads = "does not contain") → location → ad group → BROAD keywords → responsive search ad.

## Setup

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

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

The full request/response of each attempt is logged in the terminal running `npm run dev`. API errors are returned to the UI with their field path (e.g. `operations[1].create.campaign.name`) and message.

## Notes

- Location is resolved with `GeoTargetConstantService.suggestGeoTargetConstants`; the first suggestion is used.
- The "Open in Google Ads" link may ask you to pick the account if you're not already in it.
- The ad group and ad are ENABLED, but the campaign is PAUSED, so nothing serves until you enable the campaign.
