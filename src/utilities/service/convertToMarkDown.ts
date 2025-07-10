import { FileUpload } from 'graphql-upload-ts';
import { BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import TurndownService from 'turndown';
import { Readable } from 'stream';
import { extname } from 'path';
import { streamToBuffer } from './helpers.service';

// Main function: Convert DOCX to Markdown
export const convertDocxToMarkdown = async (
  file: FileUpload,
): Promise<{ markdown: string }> => {
  try {
    // Validate file
    if (!file || !file.createReadStream) {
      throw new BadRequestException('Invalid file upload.');
    }

    const { createReadStream, filename } = file;
    const stream = createReadStream();
    const fileExtension = extname(filename).toLowerCase(); // Get file extension

    if (!['.doc', '.docx'].includes(fileExtension) || !stream) {
      throw new BadRequestException(`Invalid or unreadable file: ${filename}`);
    }

    // Convert stream to buffer
    const fileBuffer = await streamToBuffer(stream);

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException(`Uploaded file is empty: ${filename}`);
    }

    // Convert DOCX to HTML
    const { value: html } = await mammoth.convertToHtml({ buffer: fileBuffer });

    // Convert HTML to Markdown
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(html);

    return { markdown };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
};

export const convertDocxToHtml = async (file: FileUpload): Promise<string> => {
  try {
    // Validate file
    if (!file || !file.createReadStream) {
      throw new BadRequestException('Invalid file upload.');
    }

    const { createReadStream, filename } = file;
    const stream = createReadStream();

    if (!stream) {
      throw new BadRequestException(`Unable to read file: ${filename}`);
    }

    // Convert stream to buffer
    const fileBuffer = await streamToBuffer(stream);

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException(`Uploaded file is empty: ${filename}`);
    }

    // Convert DOCX to HTML
    const { value: html } = await mammoth.convertToHtml({ buffer: fileBuffer });

    // Convert HTML to Markdown
    // const turndownService = new TurndownService();
    // const markdown = turndownService.turndown(html);

    return html;
  } catch (error) {
    console.error('Error converting DOCX to Html:', error);
    throw new BadRequestException('Failed to convert DOCX to Html.');
  }
};
