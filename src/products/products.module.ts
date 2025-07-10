import { Module } from '@nestjs/common';
import { ProductService } from './service/products.service';
import { ProductResolver } from './resolver/products.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductEntity, ProductSchema } from './entity/products.entity';
import {
  SlideProductEntity,
  SlideProductSchema,
} from './entity/products.slide.entity';
import { SlideProductResolver } from './resolver/products.slide.resolver';
import { SlideProductService } from './service/products.slide.service';
import {
  ClinExamProdEntity,
  ClinExamProdSchema,
} from './entity/products.clinEx.entity';
import { ClinExamProdService } from './service/products.clinEx.service';
import { ClinExamProdResolver } from './resolver/products.clinEx.resolver';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: ProductEntity.name,
        useFactory: () => {
          return ProductSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: SlideProductEntity.name,
        useFactory: () => {
          return SlideProductSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: ClinExamProdEntity.name,
        useFactory: () => {
          return ClinExamProdSchema;
        },
      },
    ]),
  ],
  providers: [
    ProductService,
    ProductResolver,
    SlideProductResolver,
    SlideProductService,
    ClinExamProdResolver,
    ClinExamProdService,
  ],
  exports: [ProductService, SlideProductService, ClinExamProdService],
})
export class ProductModule {}
