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
    await this.init();
    const { html } = parameters;
    const page = await this.browser.newPage();
    await page.goto('about:blank');
    await page.evaluate((html) => {
      document.body.innerHTML = html;
    }, html);

    const pdfBuffer = await page.pdf({
      width: 1200,
      printBackground: true, // include background colors and images
    });
    await page.close();
    return pdfBuffer;
  }
}
