# Google Play Store Deployment Guide

## ✅ Configuration Updates Made

### app.json Changes:
1. ✅ Added `versionCode: 1` - Required for Play Store versioning
2. ✅ Added `description` - Will be used in app metadata
3. ✅ Added `primaryColor` - Defines your brand color

### eas.json Changes:
1. ✅ Configured `submit.production.android` with:
   - `track: "internal"` - Submits to internal testing track (safer for first release)
   - `releaseStatus: "draft"` - Creates a draft release that you can review before publishing

---

## 📋 Pre-Build Checklist

Before building, ensure you have:

- [ ] **EAS Account**: Run `npx eas-cli login`
- [ ] **Google Play Developer Account** ($25 one-time fee)
- [ ] **App Created in Play Console** with package name: `com.aftab.cupg`
- [ ] **All required assets**:
  - App icon (done ✅)
  - Feature graphic (1024x500px)
  - Screenshots (at least 2)
  - Privacy policy URL (host your PRIVACY_POLICY.md online)

---

## 🔧 Build Commands

### 1. Production Build (APK/AAB)

```bash
# Build Android App Bundle (AAB - recommended for Play Store)
npx eas build --platform android --profile production

# Or build APK for testing
npx eas build --platform android --profile production --non-interactive
```

The build will:
- Use auto-increment for version codes
- Create optimized production bundle
- Sign with your credentials (EAS will generate if first time)

### 2. First Time Build Setup

If this is your first build, EAS will ask:
```
? Would you like to automatically create credentials? (Y/n)
```
Answer **Yes** - EAS will generate and manage your keystore.

---

## 📤 Submission Options

### Option A: Automatic Submission (Recommended)

**Setup Required:**
1. **Create Google Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable "Google Play Android Developer API"
   - Create Service Account → Create Key (JSON)
   - Download the JSON key file

2. **Grant Service Account Access**:
   - Go to Play Console → Users and Permissions
   - Invite user (use service account email)
   - Grant "Release to production, exclude from play app signing, and release to testing tracks" permission

3. **Update eas.json**:
   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "./google-service-account.json",
         "track": "internal",
         "releaseStatus": "draft"
       }
     }
   }
   ```

4. **Submit Command**:
   ```bash
   npx eas submit --platform android --profile production
   ```

### Option B: Manual Submission (Easier for First Time)

1. **Download the AAB** from EAS build page or:
   ```bash
   npx eas build:download --platform android --latest
   ```

2. **Upload to Play Console**:
   - Go to [Play Console](https://play.google.com/console)
   - Select your app → Release → Testing → Internal testing
   - Create new release
   - Upload the AAB file
   - Fill in release notes
   - Review and roll out

---

## 🔄 Version Management

### For Future Updates:

**1. Update version in app.json:**
```json
{
  "version": "1.0.1",  // User-facing version
  "android": {
    "versionCode": 2   // Increment manually or use auto-increment
  }
}
```

**2. Or use auto-increment (already enabled):**
```bash
# EAS will auto-increment versionCode based on Play Store
npx eas build --platform android --profile production --auto-submit
```

---

## 📝 Play Store Listing Requirements

Before publishing, prepare these in Play Console:

### Required Information:
- [ ] **App Name**: CUPGMSH
- [ ] **Short Description** (80 chars max)
- [ ] **Full Description** (4000 chars max)
- [ ] **App Category**: Productivity / Business
- [ ] **Content Rating**: Complete questionnaire
- [ ] **Privacy Policy URL**: Host PRIVACY_POLICY.md and provide URL
- [ ] **Target Audience**: Define age groups

### Required Graphics:
- [ ] **App Icon**: 512x512px (you have this ✅)
- [ ] **Feature Graphic**: 1024x500px
- [ ] **Phone Screenshots**: 2-8 images (minimum 320px on shortest side)
- [ ] **7-inch Tablet Screenshots**: Optional but recommended
- [ ] **10-inch Tablet Screenshots**: Optional

### Store Listing Tips:
```
Title: CUPG Mess Hall Management
Short Description: Efficient mess hall management for boarders, staff & managers

Full Description:
CUPG Mess Hall is a comprehensive management system designed for educational institutions and boarding facilities.

Features:
• Real-time meal tracking and logging
• Payment management and balance tracking
• Expense tracking and reporting
• Store inventory management
• Multi-role access (Boarders, Staff, Managers)
• Offline support with smart caching
• QR code integration
• Receipt generation and sharing

Perfect for mess halls, canteens, and dining facilities that need efficient operations management.
```

---

## 🚀 Deployment Steps Summary

### First Release:
```bash
# 1. Login to EAS
npx eas-cli login

# 2. Build production AAB
npx eas build --platform android --profile production

# 3. Wait for build to complete (~15-20 minutes)
# 4. Download and manually upload to Play Console (Option B above)
# 5. Fill out store listing in Play Console
# 6. Submit for review (2-7 days for first release)
```

### Subsequent Releases:
```bash
# Update version in app.json, then:
npx eas build --platform android --profile production

# If you've set up service account:
npx eas submit --platform android --profile production
```

---

## 🎯 Testing Tracks

Your current configuration uses `"track": "internal"`:

- **Internal Testing**: Up to 100 testers, instant availability
- **Closed Testing**: Private alpha/beta testing
- **Open Testing**: Public beta testing  
- **Production**: Live on Play Store

To change track, update `track` in eas.json:
```json
"track": "internal"  // or "closed", "open", "production"
```

---

## ⚠️ Important Notes

1. **First Submission**: May take 2-7 days for Google review
2. **Subsequent Updates**: Usually 1-3 days
3. **Sensitive Permissions**: Your app uses CAMERA, STORAGE, etc. - be prepared to justify in review
4. **Service Account**: Keep the JSON key secure, add to .gitignore
5. **Keystore**: EAS manages this for you, but you can download and backup from console

---

## 🔒 Security Checklist

- [ ] Add `google-service-account.json` to `.gitignore`
- [ ] Never commit credentials or API keys
- [ ] Review all permissions and remove unused ones
- [ ] Test on multiple devices before release
- [ ] Enable Play App Signing in Play Console

---

## 📞 Support Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)

---

## 🎉 Ready to Build!

Your configuration is now production-ready. Start with:

```bash
npx eas build --platform android --profile production
```

Good luck with your release! 🚀

