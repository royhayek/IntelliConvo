# Upload Folder Migration Guide

This guide explains the migration from flat file structure to organized folder structure for uploaded files.

## Overview

### Old Structure (Flat)
```
uploads/
├── abc123.pdf
├── logo-def456.png
├── xyz789.txt
└── ...
```

### New Structure (Organized)
```
uploads/
├── files/
│   ├── {siteId}/
│   │   ├── abc123.pdf
│   │   └── xyz789.txt
├── logos/
│   └── {siteId}/
│       └── logo-def456.png
└── avatars/
    └── {siteId}/
        └── (future use)
```

## Benefits

- **Better Organization**: Files grouped by type and site
- **Easier Backups**: Can backup specific site's files
- **Improved Security**: Site-specific folders enable better access control
- **Scalability**: Prevents single directory from becoming too large

## Changes Made

### 1. New File Storage Utility (`src/utils/fileStorage.ts`)

Centralized file storage management with organized paths:

```typescript
import { saveFile, deleteFile, FileType } from '../utils/fileStorage';

// Save a file
const fileUrl = await saveFile({
  fileType: FileType.LOGO,     // or FileType.KNOWLEDGE, FileType.AVATAR
  siteId: 'site-123',
  buffer: fileBuffer,
  originalName: 'logo.png',
});
// Returns: /uploads/logos/site-123/logo-abc123.png

// Delete a file
await deleteFile(fileUrl);
```

### 2. Updated Services

#### WidgetService (`src/services/widget/WidgetService.ts`)
- `uploadLogo()` - Now saves to `uploads/logos/{siteId}/`
- `deleteLogo()` - Uses new deleteFile utility

#### FileProcessor (`src/services/fileProcessor.ts`)
- `processUploadedFile()` - Now saves to `uploads/files/{siteId}/`
- `deleteKnowledgeFile()` - Uses new deleteFile utility

### 3. Migration Script

The migration script (`src/scripts/migrate-uploads.ts`) handles moving existing files to the new structure.

## Running the Migration

### Prerequisites

1. **Backup your uploads folder**:
   ```bash
   cp -r uploads uploads_backup
   ```

2. **Ensure database is accessible**:
   The migration script needs to query the database to map files to siteIds.

### Execute Migration

```bash
# Navigate to backend directory
cd backend

# Run the migration script
npx tsx src/scripts/migrate-uploads.ts
```

### What the Script Does

1. **Finds all knowledge files** in the database with file URLs
2. **Finds all widget logos** in the database
3. **For each file**:
   - Checks if already migrated (skips if so)
   - Creates new organized directory structure
   - Moves file from old location to new location
   - Updates database record with new path
4. **Reports** migration statistics:
   - Total files found
   - Successfully migrated
   - Skipped (already migrated or missing)
   - Failed (with error details)

### Migration Output Example

```
Starting uploads folder migration...
Starting knowledge files migration...
Found 25 knowledge files to migrate
Migrated: /uploads/abc123.pdf -> /uploads/files/site-123/abc123.pdf
Migrated: /uploads/xyz789.txt -> /uploads/files/site-456/xyz789.txt
...

Starting widget logos migration...
Found 5 widget logos to migrate
Migrated: /uploads/logo-def456.png -> /uploads/logos/site-123/logo-def456.png
...

=== Migration Summary ===
Total files found: 30
Successfully migrated: 28
Skipped (already migrated or not found): 2
Failed: 0

Migration complete!
```

### Safe to Run Multiple Times

The migration script is **idempotent** - safe to run multiple times:
- Detects already-migrated files (checks for `/files/` or `/logos/` in path)
- Skips them without errors
- Only migrates files still in old flat structure

## Post-Migration

### Verification

1. **Check new directory structure**:
   ```bash
   ls -la uploads/files/
   ls -la uploads/logos/
   ```

2. **Verify uploads work**:
   - Upload a new knowledge file
   - Upload a new widget logo
   - Verify they appear in organized folders

3. **Test file serving**:
   - Visit widget page
   - Check if custom logo displays
   - Access knowledge files

### Cleanup

After verifying migration success:

1. **Check for orphaned files**:
   ```bash
   # Files in uploads root are orphaned
   ls -la uploads/*.{pdf,png,jpg,txt}
   ```

2. **Remove backup** (only after confirming everything works):
   ```bash
   rm -rf uploads_backup
   ```

## New File Upload Behavior

After migration, all new uploads automatically use the organized structure:

- **Knowledge Files**: `uploads/files/{siteId}/{hash}.{ext}`
- **Widget Logos**: `uploads/logos/{siteId}/logo-{hash}.{ext}`
- **Future Avatars**: `uploads/avatars/{siteId}/avatar-{hash}.{ext}`

## Rollback (If Needed)

If you need to rollback:

1. **Stop the backend server**
2. **Restore from backup**:
   ```bash
   rm -rf uploads
   mv uploads_backup uploads
   ```
3. **Revert code changes**:
   ```bash
   git checkout HEAD -- src/utils/fileStorage.ts src/services/widget/WidgetService.ts src/services/fileProcessor.ts
   ```
4. **Restart server**

## Troubleshooting

### "File not found" errors

- Check file permissions: `chmod -R 755 uploads/`
- Verify database paths match actual files
- Check migration script output for failures

### Database path mismatches

If files show old paths in database but are in new structure:
```bash
# Re-run migration (it will skip physical moves but update DB)
npx tsx src/scripts/migrate-uploads.ts
```

### Large number of files

For systems with thousands of files:
- Migration may take several minutes
- Consider running during low-traffic period
- Monitor disk space during migration

## Technical Details

### File Naming Convention

- **Hash-based naming**: Prevents filename collisions
- **Preserves extensions**: Original file extension retained
- **Type prefixes**: Logos have `logo-` prefix, avatars have `avatar-` prefix

### Database Updates

Tables updated by migration:
- `KnowledgeFile.fileUrl`
- `WidgetSettings.launcherCustomIconUrl`

### Static File Serving

The Express static middleware automatically serves nested folders:

```typescript
// Already configured in src/index.ts
app.use('/uploads', express.static('uploads'));
```

This means:
- `/uploads/files/{siteId}/file.pdf` serves from `uploads/files/{siteId}/file.pdf`
- `/uploads/logos/{siteId}/logo.png` serves from `uploads/logos/{siteId}/logo.png`

## Future Enhancements

Potential additions:
- User avatars in `uploads/avatars/{siteId}/`
- Temporary files with auto-cleanup
- CDN integration for file serving
- S3/cloud storage backend option
