import { Module } from "@nestjs/common";

import { CloudinaryProvider } from "./cloudinary.provider";
import { CloudinaryService } from "./cloudianry.service";

@Module({
  providers: [
    CloudinaryProvider,
    CloudinaryService,
  ],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}