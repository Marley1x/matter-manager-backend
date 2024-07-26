import { Injectable, OnModuleInit } from '@nestjs/common';
import puppeteer, { type Browser } from 'puppeteer';

@Injectable()
export class PdfService implements OnModuleInit {
  private logContext = PdfService.name;
  private browser: Browser | null = null;
  private open = false;

  constructor() {}
  async onModuleInit() {
    await this.init();
  }
  async init() {
    if (this.open) {
      return;
    }
    console.log(`[${this.logContext}]: initializing pdf service`);
    this.browser = await puppeteer.launch();
    this.open = true;
  }

  async htmlToPDFBuffer(parameters: { html: string }): Promise<Buffer> {
    let page = null;
    try {
      console.log(`[${this.logContext}]: PDF_GEN - starting pdf generation`);
      await this.init();

      const { html } = parameters;
      console.log(`[${this.logContext}]: PDF_GEN - request new browser page`);
      page = await this.browser.newPage();

      console.log(`[${this.logContext}]: PDF_GEN - navigating to blank page`);
      await page.goto('about:blank');

      console.log(`[${this.logContext}]: PDF_GEN - setting page content`);
      await page.evaluate((html) => {
        document.body.innerHTML = html;
      }, html);

      console.log(`[${this.logContext}]: PDF_GEN - print pdf`);
      const pdfBuffer = await page.pdf({
        width: 1200,
        printBackground: true, // include background colors and images
      });

      console.log(`[${this.logContext}]: PDF_GEN - request page close`);
      return pdfBuffer;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}
