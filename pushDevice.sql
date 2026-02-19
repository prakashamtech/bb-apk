
CREATE TABLE BestBazaar.dbo.PushDevices (
	Id uniqueidentifier DEFAULT newid() NOT NULL,
	UserId uniqueidentifier NULL,
	AnonymousUserId nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	FcmToken nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	ClientType nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	Platform nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	DeviceName nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	DeviceModel nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	IsActive bit DEFAULT 1 NOT NULL,
	LastSeenAt datetime2 NULL,
	[Attributes] nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CreatedAt datetime2 DEFAULT sysutcdatetime() NOT NULL,
	UpdatedAt datetime2 DEFAULT sysutcdatetime() NOT NULL,
	CONSTRAINT PK_PushDevices PRIMARY KEY (Id),
	CONSTRAINT UQ_PushDevices_FcmToken UNIQUE (FcmToken)
);