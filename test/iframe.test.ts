import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { preview } from 'vite';
import puppeteer from 'puppeteer';
import type { PreviewServer } from 'vite';
import type { Browser, Page } from 'puppeteer';
import { TestResult } from './examples/cases';

describe('ifame test', async () => {
    let server: PreviewServer;
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        server = await preview({ preview: { port: 8000 } });
        browser = await puppeteer.launch({ headless: true });
        page = await browser.newPage();
    });

    afterAll(async () => {
        // await browser.close();
        // await server.httpServer.close();
    });

    test('should have the correct title', async () => {
        try {
            await page.goto('http://localhost:8000');
            await page.content();
            const cases = (await page.evaluate(() => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(window.runCases());
                    });
                });
            })) as TestResult[];
            cases.forEach((caseItem) => {
                expect(caseItem.case.result).toEqual(caseItem.expect.result);
                expect(caseItem.case.error).toEqual(caseItem.expect.error);
            });
        } catch (e) {
            console.error(e);
        }
    }, 60_000);
});
