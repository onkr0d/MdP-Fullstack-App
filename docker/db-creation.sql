USE master;

CREATE DATABASE WisspTemp;

GO

USE WisspTemp;

CREATE TABLE [Answers](
                          [AnswerID] [int] IDENTITY(1,1) NOT NULL,
                          [Response] [nvarchar](max) NOT NULL,
                          [CallerID] [char](10) NOT NULL,
                          [Created] [datetime] NOT NULL,
                          [TwilioSID] [nchar](10) NULL,
                          [Processed] [bit] NOT NULL,
                          CONSTRAINT [PK_Answers_1] PRIMARY KEY CLUSTERED
                              (
                               [AnswerID] ASC
                                  )WITH (
                                  PAD_INDEX = OFF,
                                  STATISTICS_NORECOMPUTE = OFF,
                                  IGNORE_DUP_KEY = OFF,
                                  ALLOW_ROW_LOCKS = ON,
                                  ALLOW_PAGE_LOCKS = ON
                                  ) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];

ALTER TABLE [dbo].[Answers] ADD CONSTRAINT [DF_Answers_Processed] DEFAULT ((0)) FOR [Processed];
