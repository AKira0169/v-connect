import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const ResponseMessage = (message: string): CustomDecorator =>
  SetMetadata('responseMessage', message);
