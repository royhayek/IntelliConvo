import { PlaywrightCrawler, Configuration } from 'crawlee';

Configuration.getGlobalConfig().set('persistStorage', false);

async function testCrawl() {
  const crawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: 120,

    requestHandler: async ({ page }) => {
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);

      // Get HTML BEFORE modification
      const contentBefore = await page.evaluate(() => document.body.innerText);

      console.log('=== BEFORE MODIFICATION ===');
      console.log(`innerText: ${contentBefore.length} chars`);

      // Use the SAME logic as the updated expandAllAccordions function
      const revealed = await page.evaluate(() => {
        let count = 0;

        // PART 1: Handle elements hidden via inline styles - CRITICAL for Elementor
        document.querySelectorAll('[style*="display: none"], [style*="display:none"], [style*="height: 0"], [style*="height:0"]').forEach((el) => {
          const htmlEl = el as HTMLElement;
          const tagName = htmlEl.tagName.toLowerCase();
          const text = htmlEl.textContent?.trim() || '';

          // Skip obvious UI elements but be more permissive with content
          const isModal = htmlEl.classList.contains('modal') || htmlEl.classList.contains('popup') ||
                          htmlEl.classList.contains('overlay') || htmlEl.id.includes('modal');
          const isContent = text.length > 15 ||
                            htmlEl.classList.contains('ui-e-accordion-content') ||
                            htmlEl.classList.contains('ui-e-content') ||
                            htmlEl.classList.contains('accordion-content') ||
                            htmlEl.classList.contains('faq-answer') ||
                            tagName === 'p' || tagName === 'div' || tagName === 'section';

          if (!isModal && isContent) {
            htmlEl.style.display = 'block';
            htmlEl.style.height = 'auto';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.overflow = 'visible';
            htmlEl.style.maxHeight = 'none';
            htmlEl.style.opacity = '1';
            count++;
          }
        });

        // PART 2: Specifically target Elementor accordion content regardless of computed style
        document.querySelectorAll('.ui-e-accordion-content, .ui-e-content, .elementor-tab-content, .elementor-accordion-content').forEach((el) => {
          const htmlEl = el as HTMLElement;
          // Force reveal regardless of current state
          htmlEl.style.display = 'block';
          htmlEl.style.height = 'auto';
          htmlEl.style.visibility = 'visible';
          htmlEl.style.overflow = 'visible';
          htmlEl.style.maxHeight = 'none';
          htmlEl.style.opacity = '1';
          count++;
        });

        return count;
      });

      console.log(`\n=== REVEALED ${revealed} ELEMENTS ===`);

      // Get content AFTER modification
      const contentAfter = await page.evaluate(() => document.body.innerText);

      console.log('\n=== AFTER MODIFICATION ===');
      console.log(`innerText: ${contentAfter.length} chars`);
      console.log(`Content increase: ${contentAfter.length - contentBefore.length} chars`);

      // Check how many accordion items we found
      const accordionInfo = await page.evaluate(() => {
        const panels = document.querySelectorAll('.ui-e-accordion-content, .ui-e-content');
        return {
          count: panels.length,
          texts: Array.from(panels).map(p => (p as HTMLElement).innerText.trim().substring(0, 100))
        };
      });

      console.log(`\n=== ACCORDION PANELS: ${accordionInfo.count} ===`);
      accordionInfo.texts.forEach((text, i) => {
        console.log(`  ${i + 1}. ${text}...`);
      });

      // Show the full content for verification
      console.log('\n=== FULL CONTENT (first 5000 chars) ===');
      console.log(contentAfter.substring(0, 5000));
    }
  });

  await crawler.run(['https://mojo.com.lb/faq']);
}

testCrawl().catch(console.error);
