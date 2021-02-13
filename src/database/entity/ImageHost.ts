require("dotenv").config();
import { Entity, ObjectID, ObjectIdColumn, Column, BeforeInsert, AfterLoad, AfterUpdate } from "typeorm";

export enum Permission {
  Public = "PUBLIC",
  Private = "PRIVATE",
  Secure = "SECURE",
}

export enum UploadExpiration {
  P0M = "P0M",
  P5M = "P5M",
  P15M = "P15M",
  P30M = "P30M",
  P1H = "P1H",
  P2H = "P2H",
  P6H = "P6H",
  P1D = "P1D",
  P2D = "P2D",
  P3D = "P3D",
  P1W = "P1W",
  P2W = "P2W",
}

@Entity()
export class ImageHost {
  @ObjectIdColumn()
  id: string;

  @Column()
  title: string;

  @Column({
    nullable: true,
  })
  description: string;

  @Column()
  gen_url: string;

  @Column()
  gen_id: string;

  @Column()
  permission: Permission;

  @Column({
    nullable: true,
  })
  secret_access: string;

  @Column()
  blob_name: string;

  @Column()
  like: number;

  @Column()
  view: number;

  @Column()
  expirate: Date;

  @Column()
  expirate_type: UploadExpiration;

  @Column()
  created_date: Date;

  @Column({
    nullable: true,
  })
  edited_date: Date;

  @Column({
    nullable: true,
  })
  url: string;

  @BeforeInsert()
  setCreatedDate() {
    this.created_date = new Date();
  }
  @BeforeInsert()
  setInitLike() {
    this.like = 0;
  }
  @BeforeInsert()
  setInitView() {
    this.view = 0;
  }

  @AfterUpdate()
  updateEditedDate() {
    this.edited_date = new Date();
  }
}
