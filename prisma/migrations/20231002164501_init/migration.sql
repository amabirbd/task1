-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailServer" (
    "id" TEXT NOT NULL,
    "mailServer" TEXT NOT NULL,
    "mailPort" INTEGER NOT NULL,
    "mailUser" TEXT NOT NULL,
    "mailPassword" TEXT NOT NULL,
    "mailServerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MailServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mail" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ranking" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "mailServerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Mail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MailServer_mailServerId_key" ON "MailServer"("mailServerId");

-- AddForeignKey
ALTER TABLE "MailServer" ADD CONSTRAINT "MailServer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_mailServerId_fkey" FOREIGN KEY ("mailServerId") REFERENCES "MailServer"("mailServerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
