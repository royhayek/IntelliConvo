# AWS S3 Storage Integration Guide

This guide explains how to configure and use AWS S3 for file storage in IntelligentConvo.

## Overview

The file storage system supports two modes:
- **Local Storage** (default): Files stored in `uploads/` directory
- **AWS S3** (optional): Files stored in Amazon S3 bucket

The system automatically detects which mode to use based on AWS credentials. When S3 credentials are provided, all new file uploads use S3. Otherwise, files are stored locally.

## Benefits of S3 Storage

✅ **Scalability** - No local disk space limitations
✅ **Reliability** - AWS's 99.999999999% durability
✅ **Performance** - Global CDN integration
✅ **Cost-Effective** - Pay only for what you use
✅ **Backup & Recovery** - Built-in versioning and backup options

## Configuration

### 1. Create AWS S3 Bucket

1. **Sign in to AWS Console**
   - Go to https://console.aws.amazon.com/s3/

2. **Create Bucket**
   - Click "Create bucket"
   - Choose a globally unique name (e.g., `intelligentconvo-uploads`)
   - Select your preferred region
   - **Block Public Access**: Uncheck "Block all public access"
     - ⚠️ Required for public file access
     - Files are individually marked as public-read
   - Create the bucket

3. **Configure Bucket Policy** (Optional but recommended)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```
   Replace `your-bucket-name` with your actual bucket name.

4. **Enable CORS** (if serving files to frontend)
   - Go to bucket → Permissions → CORS
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

### 2. Create IAM User with S3 Access

1. **Go to IAM Console**
   - https://console.aws.amazon.com/iam/

2. **Create User**
   - Users → Add users
   - Username: `intelligentconvo-s3`
   - Access type: Programmatic access

3. **Attach Policy**
   - Attach existing policy: `AmazonS3FullAccess`
   - Or create custom policy for specific bucket:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

4. **Save Credentials**
   - Download the CSV file with Access Key ID and Secret Access Key
   - ⚠️ Store securely - you won't be able to retrieve the secret key again!

### 3. Update Environment Variables

Add to your `.env` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Optional: Custom CDN URL
AWS_S3_PUBLIC_URL=https://cdn.yourdomain.com
```

### 4. Restart Server

```bash
npm run dev
```

Check the logs for confirmation:
```
📦 S3 storage initialized { bucket: 'your-bucket-name', region: 'us-east-1' }
```

## Usage

### Automatic Mode Detection

The system automatically uses the configured storage:

```typescript
// Same code works for both local and S3 storage
import { saveFile, FileType } from '../utils/fileStorage';

const fileUrl = await saveFile({
  fileType: FileType.LOGO,
  siteId: 'site-123',
  buffer: fileBuffer,
  originalName: 'logo.png',
});
// Returns: https://your-bucket.s3.us-east-1.amazonaws.com/logos/site-123/logo-abc123.png
// Or: /uploads/logos/site-123/logo-abc123.png (if using local storage)
```

### File Organization

Files are organized in S3 using the same structure as local storage:

```
S3 Bucket:
├── files/{siteId}/file1.pdf
├── logos/{siteId}/logo1.png
└── avatars/{siteId}/avatar1.jpg
```

S3 Key examples:
- `files/9e09218f-a17c-4a07-a22d-f2af08953a43/abc123.pdf`
- `logos/9e09218f-a17c-4a07-a22d-f2af08953a43/logo-def456.png`

### CDN Integration (Optional)

For better performance, use a CDN like CloudFront:

1. **Create CloudFront Distribution**
   - Origin: Your S3 bucket
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD

2. **Update Environment Variable**
   ```bash
   AWS_S3_PUBLIC_URL=https://d1234567890.cloudfront.net
   ```

3. **URLs will use CDN**
   ```
   https://d1234567890.cloudfront.net/logos/site-123/logo.png
   ```
   Instead of:
   ```
   https://bucket.s3.amazonaws.com/logos/site-123/logo.png
   ```

## Switching Storage Modes

### Local to S3

1. **Configure S3 credentials** in `.env`
2. **Restart server**
3. **New uploads** automatically go to S3
4. **Old files** remain in local storage (still accessible)

### S3 to Local

1. **Remove or comment out** S3 credentials in `.env`
2. **Restart server**
3. **New uploads** automatically use local storage
4. **Old S3 files** remain accessible via their URLs

## Storage Information

### Check Current Storage Mode

```typescript
import { getStorageType, getStorageInfo } from '../utils/fileStorage';

console.log(getStorageType()); // 'S3' or 'LOCAL'
console.log(getStorageInfo());
// S3: { type: 'S3', isConfigured: true, bucket: '...', region: '...', publicUrl: '...' }
// Local: { type: 'LOCAL', uploadDir: 'uploads' }
```

### Startup Logs

The server logs the storage configuration on startup:

```
# S3 Configured:
📦 S3 storage initialized { bucket: 'intelligentconvo-uploads', region: 'us-east-1', hasCustomUrl: false }

# S3 Not Configured:
📦 S3 storage not configured - using local storage
```

## Cost Optimization

### S3 Pricing (as of 2024)

- **Storage**: ~$0.023/GB per month (Standard tier)
- **Requests**:
  - PUT/POST: $0.005 per 1,000 requests
  - GET: $0.0004 per 1,000 requests
- **Data Transfer**: First 100GB/month free, then $0.09/GB

### Best Practices

1. **Lifecycle Rules** - Archive old files to cheaper storage classes
2. **CloudFront CDN** - Reduce S3 GET requests and data transfer costs
3. **Versioning** - Enable only if needed (costs extra)
4. **Monitoring** - Use AWS Cost Explorer to track spending

### Example Monthly Cost

For a typical site with:
- 1,000 files (~500MB total)
- 10,000 file views/month
- 100 new uploads/month

Estimated cost: **$0.50 - $2.00/month**

## Security Best Practices

1. **IAM User Permissions**
   - Use least-privilege access
   - Only grant necessary S3 permissions
   - Don't use root AWS account credentials

2. **Bucket Security**
   - Enable bucket versioning for recovery
   - Use bucket policies for access control
   - Enable server-side encryption (SSE-S3)
   - Monitor access with CloudTrail

3. **Credential Management**
   - Never commit `.env` to git
   - Rotate access keys regularly
   - Use AWS Secrets Manager in production

4. **Public Access**
   - Only uploaded files are public-read
   - Bucket itself is not publicly listable
   - Configure CORS properly

## Troubleshooting

### S3 Not Detecting Configuration

**Check environment variables:**
```bash
# In backend directory
echo $AWS_ACCESS_KEY_ID
echo $AWS_S3_BUCKET
```

**Verify not using placeholder values:**
```
AWS_ACCESS_KEY_ID=your-aws-access-key-id  ❌ Placeholder
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE   ✅ Real key
```

### Upload Fails with Access Denied

**Check bucket permissions:**
- Bucket policy allows PutObject
- IAM user has correct permissions
- Bucket name is correct in .env

**Test credentials:**
```bash
aws s3 ls s3://your-bucket-name --profile intelligentconvo
```

### Files Not Publicly Accessible

**Check:**
1. Bucket blocks public access → Should be unchecked
2. Files uploaded with ACL → Should be 'public-read'
3. Bucket policy → Should allow GetObject

### High S3 Costs

**Optimize:**
1. Enable CloudFront → Reduces S3 requests
2. Set up lifecycle rules → Move old files to cheaper storage
3. Check for unnecessary file duplicates
4. Review access logs for unusual patterns

## Migration Between Storage Types

### Moving Existing Local Files to S3

Currently, files remain in their original storage location. To migrate:

1. **Manual Migration Script** (future feature)
2. **Keep Hybrid** - Old files local, new files S3
3. **Gradually Replace** - Re-upload files as needed

### Moving S3 Files to Local

Download files from S3 to local storage:

```bash
# Use AWS CLI
aws s3 sync s3://your-bucket-name/files/ uploads/files/ --profile intelligentconvo
aws s3 sync s3://your-bucket-name/logos/ uploads/logos/ --profile intelligentconvo
```

Update database file URLs to use local paths.

## Advanced Features

### Custom Storage Class

Modify `src/lib/s3.ts` to use different storage class:

```typescript
const command = new PutObjectCommand({
  Bucket: s3Bucket,
  Key: key,
  Body: buffer,
  ContentType: contentType,
  ACL: 'public-read',
  StorageClass: 'INTELLIGENT_TIERING', // Add this
});
```

### Server-Side Encryption

```typescript
const command = new PutObjectCommand({
  Bucket: s3Bucket,
  Key: key,
  Body: buffer,
  ContentType: contentType,
  ACL: 'public-read',
  ServerSideEncryption: 'AES256', // Add this
});
```

### Metadata

```typescript
const command = new PutObjectCommand({
  Bucket: s3Bucket,
  Key: key,
  Body: buffer,
  ContentType: contentType,
  ACL: 'public-read',
  Metadata: { // Add this
    uploadedBy: userId,
    originalName: fileName,
  },
});
```

## Support

For issues with:
- **S3 Integration**: Check logs for error messages
- **AWS Credentials**: Verify IAM permissions
- **File Access**: Check bucket policies and CORS
- **Costs**: Monitor AWS Cost Explorer

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
