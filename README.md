[![Forge with Alphinium](https://img.shields.io/badge/🔨_Forge_with_Alphinium-Build_Your_Version-6366f1?style=for-the-badge&logo=github)](https://alphinium.com/forge?template=woof-walks)

> **This is an Alphinium template.** Click the badge above to fork this project and have an AI agent build your customised version automatically.

---

# WoofWalks

WoofWalks is a fresh, outdoorsy React Native + Expo marketplace for finding, comparing, and booking trusted local dog walkers.

## Highlights
- Browse nearby walkers by rating, price, availability, and service type
- Compare solo, group, and drop-in options in a true aggregator experience
- Book a specific walker with a lightweight guided checkout
- Demo live walk tracking, photo updates, and Ruff chat assistant
- Alphinium callouts for maps, payments, and push notifications

## Development
```bash
npm install --legacy-peer-deps
npx expo install react-dom react-native-web @expo/metro-runtime
npm run web
```

## Configuration

Copy `.env.example` to `.env` and set values as needed:

| Variable | Description | Default |
|---|---|---|
| `EXPO_PUBLIC_GA_ID` | GA4 Measurement ID | `G-X09N3J8X17` | Override with your own GA property when going live |
| `EXPO_PUBLIC_WOOF_API_BASE_URL` | WoofWalks API base URL | `https://api.woofwalks.app` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth client ID (optional) | — |
| `EXPO_PUBLIC_FACEBOOK_APP_ID` | Facebook App ID (optional) | — |
| `ALPHINIUM_MAPS_KEY` | Alphinium Maps API key | — |
| `ALPHINIUM_PAYMENTS_KEY` | Alphinium Payments API key | — |
| `ALPHINIUM_PUSH_KEY` | Alphinium Push API key | — |
| `ALPHINIUM_WALKERS_KEY` | Alphinium Walkers API key | — |

## Demo flow
1. Find a walker from the home feed
2. Review walker details and pricing
3. Confirm a booking for your dog
4. Jump into a simulated live walk tracking screen

> Built with [alphinium](https://alphinium.com) — autonomous AI development agents
