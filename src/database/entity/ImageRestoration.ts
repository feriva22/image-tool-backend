import { Entity, ObjectID, ObjectIdColumn, Column, BeforeInsert, AfterLoad } from "typeorm";

@Entity()
export class ImageRestoration {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  preimg_url: string;

  @Column()
  postimg_url: string;

  @Column()
  created_date: Date;

  @BeforeInsert()
  setCreatedDate() {
    this.created_date = new Date();
  }

  @AfterLoad()
  setServerURL() {
    this.preimg_url = "http://localhost:4002/" + this.preimg_url;
    this.postimg_url = "http://localhost:4002/" + this.postimg_url;
  }
}
