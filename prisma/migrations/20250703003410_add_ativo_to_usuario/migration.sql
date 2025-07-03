-- AlterTable
ALTER TABLE "avaliacoes" ADD COLUMN     "aprovada" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;
