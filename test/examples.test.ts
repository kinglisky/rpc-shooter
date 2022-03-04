import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import type { ViteDevServer } from 'vite';
import type { Browser, Page } from 'puppeteer';
import { TestResult } from './examples/cases';

describe('ifame test', async () => {
    let server: ViteDevServer;
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        server = await createServer();
        await server.listen();
        browser = await puppeteer.launch({ headless: true });
        page = await browser.newPage();
    });

    afterAll(async () => {
        await browser.close();
        await server.httpServer.close();
    });

    for (let i = 0; i < 10; i++) {
        test(`test ${0}`, async () => {
            expect(1).toEqual(1);
        });
    }

    // console.log(page);

    // test('ssss', async () => {
    //     try {
    //         await page.goto('http://localhost:8000');
    //         await page.content();
    //         const cases = (await page.evaluate(() => {
    //             return new Promise((resolve) => {
    //                 setTimeout(() => {
    //                     resolve(window.runCases());
    //                 });
    //             });
    //         })) as TestResult[];
    //         // cases.forEach((caseItem) => {
    //         //     expect(caseItem.case.result).not.toEqual(caseItem.expect.result);
    //         //     expect(caseItem.case.error).not.toEqual(caseItem.expect.error);
    //         // });
    //     } catch (e) {
    //         console.error(e);
    //     }
    // });
});
