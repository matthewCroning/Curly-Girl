// Required dependencies
const puppeteer = require('puppeteer');
const fs = require('fs');

// Load product data from products.json
const products = JSON.parse(fs.readFileSync('products.json', 'utf-8'));

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const results = [];

    for (const product of products) {
        const searchQuery = `${product.Brand} ${product.Product}`;
        console.log(`Searching for: ${searchQuery}`);

        try {
            await page.goto('https://www.amazon.com', { waitUntil: 'domcontentloaded' });

            // Accept cookies if prompted (adjust selector as per region)
            try {
                await page.click('#sp-cc-accept', { timeout: 2000 });
            } catch (e) {
                // No cookie prompt
            }

            // Search for the product
            await page.type('#twotabsearchtextbox', searchQuery);
            await page.click('#nav-search-submit-button');
            await page.waitForSelector('.s-main-slot');

            // Extract the first result
            const firstResult = await page.evaluate(() => {
                const result = document.querySelector('.s-main-slot .s-result-item');
                if (result) {
                    const title = result.querySelector('.a-size-base-plus.a-color-base')?.innerText || 'No title';
                    const link = result.querySelector('a.a-link-normal.s-no-outline')?.href || 'No link';
                    const price = result.querySelector('.a-price .a-offscreen')?.innerText || 'No price';
                    const rating = result.querySelector('.a-icon-star-small .a-icon-alt')?.innerText || 'No rating';

                    return { title, link, price, rating };
                }
                return null;
            });

            if (firstResult) {
                console.log(`Result for '${searchQuery}':`, firstResult);
                results.push({ searchQuery, ...firstResult });
            } else {
                console.log(`No results found for '${searchQuery}'.`);
                results.push({ searchQuery, error: 'No results found' });
            }
        } catch (error) {
            console.error(`Error searching for ${searchQuery}:`, error);
            results.push({ searchQuery, error: error.message });
        }
    }

    await browser.close();

    // Save results to a JSON file
    fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
    console.log('Search complete. Results saved to results.json.');
})();
