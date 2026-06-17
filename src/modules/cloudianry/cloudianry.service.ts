import {
  Inject,
  Injectable,
} from "@nestjs/common";

import { v2 as Cloudinary } from "cloudinary";

import * as streamifier from "streamifier";

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject("CLOUDINARY")
    private cloudinary: typeof Cloudinary,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ) {
    return new Promise<any>(
      (resolve, reject) => {
        const uploadStream =
          this.cloudinary.uploader.upload_stream(
            {
              folder,
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }

              resolve(result);
            },
          );

        streamifier
          .createReadStream(file.buffer)
          .pipe(uploadStream);
      },
    );
  }

  async deleteImage(
    publicId: string,
  ) {
    return this.cloudinary.uploader.destroy(
      publicId,
    );
  }
}