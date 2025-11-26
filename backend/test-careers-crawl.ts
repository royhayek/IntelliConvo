import { crawlSelectiveUrls } from './src/services/crawler';

async function testCareersCrawl() {
  try {
    console.log('Starting test crawl of careers page...');

    // Use the existing site ID from the logs
    const siteId = '07ed4823-3f30-4309-a25d-f337454efb40';
    const urlsToCrawl = ['https://eurisko.net/careers/'];

    await crawlSelectiveUrls(siteId, urlsToCrawl);

    console.log('✅ Crawl completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Crawl failed:', error);
    process.exit(1);
  }
}

testCareersCrawl();
