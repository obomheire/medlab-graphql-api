import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  assistantFiles,
  caseFiles,
  vectoreStore,
} from 'src/llm-providers/openAI/constant/assistant.constant';
import { AsstThreadService } from 'src/llm-providers/openAI/service/ai.thread.service';

@Injectable()
export class DeleteVSservice {
  private readonly logger = new Logger(DeleteVSservice.name);
  private lastRun: Date = new Date('2024-10-13T00:00:00'); // Start from Oct 13, 2024

  constructor(private readonly asstThreadService: AsstThreadService) {
    this.logger.log('DeleteVSservice instantiated');
  }

  // Shedule a cron task delete all vectors stores
  // @Cron('*/2 * * * *') // run the cron every minute
  // @Cron('23 15 * * *') // Run every day At 02:42 PM
  @Cron('0 4 * * *') // Runs every day at 4:00 AM
  async handleCron() {
    const now = new Date();
    const daysPassed = Math.floor(
      (now.getTime() - this.lastRun.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Run your job every 6 or more days
    if (daysPassed >= 6) {
      this.lastRun = now;
      // await this.deleteAllFiles();
      await this.deleteAllVectoreStores();
    }
  }

  async deleteAllVectoreStores() {
    this.logger.log('Cron job started');
    try {
      // Exclude specific vector stores and files by their IDs
      const excludedVSids = new Set([vectoreStore.CHAT_ASSISTANT_VS_ID]);
      const excludedFileIds = new Set([
        assistantFiles.CASE_REWRITE_FILE,
        assistantFiles.CASE_RECALL_FILE,
        assistantFiles.ABOUT_MEDSCROLL_OVERVIEW,
        assistantFiles.ABOUT_THE_COMPANY,
        assistantFiles.APP_STORE_DESCRIPTION,
        assistantFiles.FREQUENTLY_ASK_QUESTIONS,
        assistantFiles.MEDSCROLL_INNER_WORKINGS,
        caseFiles['SHORT_CASE-case1'],
        caseFiles['SHORT_CASE-case2'],
        caseFiles['SHORT_CASE-case3'],
        caseFiles['SHORT_CASE-case4'],
        caseFiles['SHORT_CASE-case5'],
        caseFiles['SHORT_CASE-case6'],
        caseFiles['SHORT_CASE-case7'],
        caseFiles['SHORT_CASE-case8'],
        caseFiles['SHORT_CASE-case9'],
        caseFiles['SHORT_CASE-case10'],
        caseFiles['SHORT_CASE-case11'],
        caseFiles['SHORT_CASE-case12'],
        caseFiles['SHORT_CASE-case13'],
        caseFiles['SHORT_CASE-case14'],
        caseFiles['SHORT_CASE-case15'],
        caseFiles['SHORT_CASE-case16'],
        caseFiles['SHORT_CASE-case17'],
        caseFiles['SHORT_CASE-case18'],
        caseFiles['SHORT_CASE-case19'],
        caseFiles['SHORT_CASE-case20'],
        caseFiles['SHORT_CASE-case21'],
        caseFiles['SHORT_CASE-case22'],
        caseFiles['SHORT_CASE-case23'],
        caseFiles['SHORT_CASE-case24'],
        caseFiles['SHORT_CASE-case25'],
        caseFiles['SHORT_CASE-case30'],
        caseFiles['SHORT_CASE-case36'],
        caseFiles['SHORT_CASE-grading'],
        caseFiles['SHORT_CASE-AI-EXAMINERS-FEEDBACK-TEMPLATE'],
        caseFiles['LONG_CASE-case1'],
        caseFiles['LONG_CASE-case2'],
        caseFiles['LONG_CASE-case3'],
        caseFiles['LONG_CASE-case4'],
        caseFiles['LONG_CASE-case5'],
        caseFiles['LONG_CASE-case6'],
        caseFiles['LONG_CASE-case7'],
        caseFiles['LONG_CASE-case8'],
        caseFiles['LONG_CASE-case9'],
        caseFiles['LONG_CASE-case10'],
        caseFiles['LONG_CASE-case11'],
        caseFiles['LONG_CASE-case12'],
        caseFiles['LONG_CASE-case13'],
        caseFiles['LONG_CASE-case14'],
        caseFiles['LONG_CASE-case15'],
        caseFiles['LONG_CASE-case16'],
        caseFiles['LONG_CASE-case17'],
        caseFiles['LONG_CASE-case18'],
        caseFiles['LONG_CASE-case19'],
        caseFiles['LONG_CASE-case20'],
        caseFiles['LONG_CASE-case21'],
        caseFiles['LONG_CASE-case22'],
        caseFiles['LONG_CASE-case23'],
        caseFiles['LONG_CASE-case24'],
        caseFiles['LONG_CASE-case25'],
        caseFiles['LONG_CASE-case26'],
        caseFiles['LONG_CASE-case27'],
        caseFiles['LONG_CASE-case28'],
        caseFiles['LONG_CASE-case29'],
        caseFiles['LONG_CASE-case30'],
        caseFiles['LONG_CASE-grading'],
        caseFiles['LONG_CASE-AI-EXAMINERS-FEEDBACK-TEMPLATE'],
      ]);

      while (true) {
        const { data: vectorStores }: any =
          await this.asstThreadService.listVectorStores(100);

        // Filter out excluded vector stores and check if there's any left to process
        const storesToProcess = vectorStores.filter(
          (vs: any) => !excludedVSids.has(vs.id),
        );

        if (storesToProcess.length === 0) {
          this.logger.log('No more vector stores to process');
          break;
        }

        this.logger.log(`Processing ${storesToProcess.length} vector stores`);

        await Promise.all(
          storesToProcess.map(async (vs: any) => {
            try {
              // List files for the current vector store
              const { data: files } = await this.asstThreadService.listVSfiles(
                vs.id,
              );

              // Filter out the files that are in the excludedFileIds set
              const filesToDelete = files.filter(
                (file: any) => !excludedFileIds.has(file.id),
              );

              if (filesToDelete.length > 0) {
                this.logger.log(
                  `Deleting ${filesToDelete.length} files from vector store: ${vs.id}`,
                );

                // Delete all non-excluded files concurrently
                await Promise.all(
                  filesToDelete.map((file: any) =>
                    this.asstThreadService.deleteVSfiles(vs.id, file.id),
                  ),
                );
              }

              // Delete the vector store after all files have been deleted
              await this.asstThreadService.deleteVectorStore(vs.id);
              this.logger.log(`Deleted vector store: ${vs.id}`);
            } catch (error) {
              this.logger.error(
                `Error processing vector store ${vs.id}: ${error.message}`,
              );
            }
          }),
        );
      }

      this.logger.log('Cron job completed');
    } catch (error) {
      this.logger.error(`Error during cron job: ${error.message}`);
    }
  }

  // Delete files
  async deleteAllFiles() {
    this.logger.log('Cron job started');
    try {
      // Exclude the files with the specified IDs
      const excludedIds = [
        assistantFiles.CASE_REWRITE_FILE,
        assistantFiles.CASE_RECALL_FILE,
        assistantFiles.ABOUT_MEDSCROLL_OVERVIEW,
        assistantFiles.ABOUT_THE_COMPANY,
        assistantFiles.APP_STORE_DESCRIPTION,
        assistantFiles.FREQUENTLY_ASK_QUESTIONS,
        assistantFiles.MEDSCROLL_INNER_WORKINGS,
        caseFiles['SHORT_CASE-case1'],
        caseFiles['SHORT_CASE-case2'],
        caseFiles['SHORT_CASE-case3'],
        caseFiles['SHORT_CASE-case4'],
        caseFiles['SHORT_CASE-case5'],
        caseFiles['SHORT_CASE-case6'],
        caseFiles['SHORT_CASE-case7'],
        caseFiles['SHORT_CASE-case8'],
        caseFiles['SHORT_CASE-case9'],
        caseFiles['SHORT_CASE-case10'],
        caseFiles['SHORT_CASE-case11'],
        caseFiles['SHORT_CASE-case12'],
        caseFiles['SHORT_CASE-case13'],
        caseFiles['SHORT_CASE-case14'],
        caseFiles['SHORT_CASE-case15'],
        caseFiles['SHORT_CASE-case16'],
        caseFiles['SHORT_CASE-case17'],
        caseFiles['SHORT_CASE-case18'],
        caseFiles['SHORT_CASE-case19'],
        caseFiles['SHORT_CASE-case20'],
        caseFiles['SHORT_CASE-case21'],
        caseFiles['SHORT_CASE-case22'],
        caseFiles['SHORT_CASE-case23'],
        caseFiles['SHORT_CASE-case24'],
        caseFiles['SHORT_CASE-case25'],
        caseFiles['SHORT_CASE-case30'],
        caseFiles['SHORT_CASE-case36'],
        caseFiles['SHORT_CASE-case51'],
        caseFiles['SHORT_CASE-grading'],
        caseFiles['SHORT_CASE-AI-EXAMINERS-FEEDBACK-TEMPLATE'],
        caseFiles['LONG_CASE-case1'],
        caseFiles['LONG_CASE-case2'],
        caseFiles['LONG_CASE-case3'],
        caseFiles['LONG_CASE-case4'],
        caseFiles['LONG_CASE-case5'],
        caseFiles['LONG_CASE-case6'],
        caseFiles['LONG_CASE-case7'],
        caseFiles['LONG_CASE-case8'],
        caseFiles['LONG_CASE-case9'],
        caseFiles['LONG_CASE-case10'],
        caseFiles['LONG_CASE-case11'],
        caseFiles['LONG_CASE-case12'],
        caseFiles['LONG_CASE-case13'],
        caseFiles['LONG_CASE-case14'],
        caseFiles['LONG_CASE-case15'],
        caseFiles['LONG_CASE-case16'],
        caseFiles['LONG_CASE-case17'],
        caseFiles['LONG_CASE-case18'],
        caseFiles['LONG_CASE-case19'],
        caseFiles['LONG_CASE-case20'],
        caseFiles['LONG_CASE-case21'],
        caseFiles['LONG_CASE-case22'],
        caseFiles['LONG_CASE-case23'],
        caseFiles['LONG_CASE-case24'],
        caseFiles['LONG_CASE-case25'],
        caseFiles['LONG_CASE-case26'],
        caseFiles['LONG_CASE-case27'],
        caseFiles['LONG_CASE-case28'],
        caseFiles['LONG_CASE-case29'],
        caseFiles['LONG_CASE-case30'],
        caseFiles['LONG_CASE-grading'],
        caseFiles['LONG_CASE-AI-EXAMINERS-FEEDBACK-TEMPLATE'],
      ];

      while (true) {
        const { data }: any = await this.asstThreadService.listFiles();

        // Check if there are any vector stores returned
        if (!data || data.length === excludedIds.length) {
          this.logger.log('No more files to process');
          break;
        }

        this.logger.log(`Found ${data.length} files`);

        // Delete all the vector stores except the one with the excluded ID
        const deletedFiles = await Promise.all(
          data
            .filter((file: any) => !excludedIds.includes(file.id)) // Exclude the specific files
            .map(async (file: any) => {
              await this.asstThreadService.deleteFile(file.id);
            }),
        );

        this.logger.log(`Deleted ${deletedFiles.length} files`);
      }

      this.logger.log('Cron job completed');
    } catch (error) {
      this.logger.error(`Error during cron job: ${error.message}`);
    }
  }

  // Shedule a cron task delete vectors stores that are expired
  // @Cron('40 07  * * *') // run the cron @ 01:46 pm
  async deleteExpiredVS() {
    this.logger.log('Cron job started');
    try {
      let after = '';
      const limit = 100;

      while (true) {
        const { data }: any = await this.asstThreadService.listVectorStores(
          limit,
          after,
        );

        // Check if there are any vector stores returned
        if (!data || !data.length) {
          this.logger.log('No more vector stores to process');
          break;
        }

        // Filter for expired vector stores
        const expiredVS = data.filter(
          (store: any) => store.status === 'expired',
        );

        this.logger.log(`Found ${expiredVS.length} expired vector store`);

        // Delete expired vector stores in parallel
        const deletetedVS = await Promise.all(
          expiredVS.map(async (vs: any) => {
            await this.asstThreadService.deleteVectorStore(vs.id);
          }),
        );

        this.logger.log(`Deleted ${deletetedVS.length} vector store`);

        // Find the last non-deleted vector store for pagination
        const lastNonDeletedStore = data.find(
          (store: any) => store.status !== 'expired',
        );

        // If fewer items are returned than the limit, assume we fetched all data
        if (data.length < limit) {
          break;
        }

        // Update the `after` cursor for pagination with the last valid, non-deleted store's ID
        after = lastNonDeletedStore.id;
      }

      this.logger.log('Cron job completed');
    } catch (error) {
      this.logger.error(`Error during cron job: ${error.message}`);
    }
  }
}
