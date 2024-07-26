import { Prisma } from '@prisma/client';
export const jobIncludeAllInformation =
  Prisma.validator<Prisma.PdfJobFindManyArgs>()({
    include: {
      emailTemplate: true,
      distributionList: {
        include: {
          distributionClientsList: {
            include: { client: true },
            where: { deletedAt: null },
          },
        },
      },
    },
  });

export type JobIncludeAllInformation = typeof jobIncludeAllInformation;

export type JobDescription = Prisma.PdfJobGetPayload<JobIncludeAllInformation>;
