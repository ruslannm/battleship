class LogDto {
  description: string;
}

export class LogUpdateDto {
  logs: {
    create: LogDto;
  };
}
