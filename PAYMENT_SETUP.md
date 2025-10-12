# Payment System Setup Guide

## Overview
The payment system has been successfully implemented. Boarders can now make advance payments via UPI by scanning a QR code or using a UPI ID, then submitting proof of payment.

## Changes Made

### 1. Boarder Signup Form
- ✅ Removed "Advance Payment" field
- ✅ Removed "Current Balance" field
- ✅ New boarders start with `advance: 0` and `current: 0`

### 2. New Payments Tab
Created `app/(boarder)/(tabs)/payments.tsx` with:
- QR code display for UPI payments
- UPI ID display with copy-to-clipboard functionality
- QR code download and share options
- Payment screenshot upload
- Amount submission form
- Payment submission that:
  - Uploads payment screenshot to Appwrite storage
  - Updates boarder's advance balance
  - Logs payment as manager funding (category: "prev")

### 3. Navigation Updates
- Added "Payments" tab to boarder dashboard
- Reordered tabs: Meals → Payments → Balance
- Used CreditCard icon for payments tab

### 4. Backend Integration
Added `submitPayment` function in `lib/actions/boarder.actions.ts`:
- Uploads screenshot to Appwrite storage bucket
- Updates boarder's advance balance
- Creates expense record with category "prev" for manager funding tracking
- Returns success/error status

### 5. Dependencies Installed
- ✅ `expo-clipboard` - For copying UPI ID
- ✅ `expo-media-library` - For saving QR code to gallery
- ✅ Already had: `expo-file-system`, `expo-image-picker`, `expo-sharing`

## Configuration Required

### ⚠️ IMPORTANT: Update Payment Details

Open `app/(boarder)/(tabs)/payments.tsx` and update these values:

```typescript
// Line 33-34: Replace with your actual UPI details
const UPI_ID = "example@upi"; // ← Replace with your actual UPI ID
const QR_CODE_URL = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=example@upi&pn=MessName&cu=INR"; // ← Replace with actual QR code URL
```

### How to Generate UPI Payment QR Code

#### Option 1: Use Google Pay/PhonePe/Paytm
1. Open your UPI app
2. Go to "Receive Money" or "My QR Code"
3. Download the QR code image
4. Upload it to a hosting service or Appwrite storage
5. Use the hosted URL in the code

#### Option 2: Generate using API (Recommended)
Update the QR_CODE_URL with your actual UPI details:

```typescript
const UPI_ID = "yourname@upi"; // Your actual UPI ID
const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${UPI_ID}&pn=YourMessName&cu=INR`;
```

Replace:
- `yourname@upi` → Your UPI ID
- `YourMessName` → Your mess/business name

#### Option 3: Host Your Own QR Code
1. Generate QR code from your UPI app
2. Upload to Appwrite storage:
   - Go to Appwrite Console → Storage
   - Create/use existing bucket
   - Upload QR code image
   - Get the file URL
   - Replace `QR_CODE_URL` with this URL

### Appwrite Storage Setup

Make sure your Appwrite storage bucket is configured:

1. **Bucket Permissions:**
   - Read: Any (so users can view uploaded receipts)
   - Write: Users (so authenticated users can upload)

2. **File Size Limits:**
   - Recommended: 5MB max for payment screenshots

3. **Allowed File Types:**
   - Images: jpg, jpeg, png

## How It Works

### For Boarders:
1. Navigate to "Payments" tab
2. Scan QR code or copy UPI ID
3. Make payment via any UPI app
4. Take screenshot of successful payment
5. Return to app, enter amount and upload screenshot
6. Submit payment
7. Advance balance is updated automatically

### For Managers:
- Payments appear in expenses list with category "prev" (previous/advance)
- This adds to the funding total
- Payment screenshots are stored and can be verified
- View in Manager → Summary tab

## Database Schema

### Boarders Table
No changes needed - using existing `advance` and `current` fields.

### Expenses Table
Using existing table with category "prev" for advance payments:
- `date`: Payment date
- `category`: "prev" (represents advance/prepaid)
- `amount`: Payment amount (positive value, adds to funding)
- `description`: Auto-generated with boarder name and user ID
- `receipt`: URL to uploaded payment screenshot

## Testing Checklist

- [ ] Update UPI_ID in payments.tsx
- [ ] Update QR_CODE_URL in payments.tsx
- [ ] Test QR code displays correctly
- [ ] Test UPI ID copy to clipboard
- [ ] Test QR code download
- [ ] Test QR code share
- [ ] Test image picker for screenshot
- [ ] Test payment submission
- [ ] Verify advance balance updates
- [ ] Verify payment appears in manager expenses
- [ ] Test with actual UPI payment

## Support

If you encounter any issues:
1. Check Appwrite storage permissions
2. Verify bucket ID in environment variables
3. Check console logs for error messages
4. Ensure all dependencies are installed: `npx expo install`

## Future Enhancements (Optional)

- Payment history view for boarders
- Payment status (pending/approved/rejected)
- Manager approval workflow for payments
- Payment notifications
- Multiple payment methods
- Receipt auto-verification

