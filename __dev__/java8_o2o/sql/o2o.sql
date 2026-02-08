USE
o2o;

create table `tb_area`
(
	`area_id`        int(2) NOT NULL AUTO_INCREMENT,
	`area_name`      varchar(200) NOT NULL,
	`priority`       int(2) NOT NULL DEFAULT '0',
	`create_time`    datetime DEFAULT NULL,
	`last_edit_time` datetime DEFAULT NULL,
	PRIMARY KEY (`area_id`),
	UNIQUE KEY `UK_AREA_NAME` (`area_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


create table `tb_person_info`
(
	`user_id`        int(10) NOT NULL AUTO_INCREMENT,
	`name`           varchar(32)   DEFAULT NULL,
	`profile_img`    varchar(1024) DEFAULT NULL,
	`email`          varchar(1024) DEFAULT NULL,
	`gender`         varchar(2)    DEFAULT NULL,
	`enable_status`  int(2) NOT NULL DEFAULT '0' COMMENT '0:禁用,1可用',
	`user_type`      int(2) NOT NULL DEFAULT '1' COMMENT '1:顧客,2:店家,3:超級管理員',
	`create_time`    datetime      DEFAULT NULL,
	`last_edit_time` datetime      DEFAULT NULL,
	PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


create table `tb_wechat_auth`
(
	`wechat_auth_id` int(10) NOT NULL AUTO_INCREMENT,
	`user_id`        int(10) NOT NULL,
	`open_id`        varchar(1024) NOT NULL,
	`create_time`    datetime DEFAULT NULL,
	PRIMARY KEY (`wechat_auth_id`),
	constraint `fk_wechat_auth_id` foreign key (`user_id`) references `tb_person_info` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
ALTER TABLE `tb_wechat_auth`
	ADD UNIQUE INDEX (`open_id`);


create table `tb_local_auth`
(
	`local_auth_id`  int(10) NOT NULL AUTO_INCREMENT,
	`user_id`        int(10) NOT NULL,
	`username`       varchar(128) NOT NULL,
	`password`       varchar(128) NOT NULL,
	`create_time`    datetime DEFAULT NULL,
	`last_edit_time` datetime DEFAULT NULL,
	PRIMARY KEY (`local_auth_id`),
	UNIQUE KEY `UK_USERNAME` (`username`),
	constraint `fk_local_auth_id` foreign key (`user_id`) references `tb_person_info` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


create table `tb_head_line`
(
	`line_id`        int(10) NOT NULL AUTO_INCREMENT,
	`line_name`      varchar(1024) DEFAULT NULL,
	`line_link`      varchar(1024) DEFAULT NULL,
	`line_img`       varchar(1024) DEFAULT NULL,
	`priority`       int(2) NOT NULL DEFAULT '0',
	`enable_status`  int(2) NOT NULL DEFAULT '0' COMMENT '0:禁用,1可用',
	`create_time`    datetime      DEFAULT NULL,
	`last_edit_time` datetime      DEFAULT NULL,
	PRIMARY KEY (`line_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


create table `tb_shop_category`
(
	`shop_category_id`   int(10) NOT NULL AUTO_INCREMENT,
	`parent_id`          int(10) DEFAULT NULL,
	`shop_category_name` varchar(100)  DEFAULT NULL,
	`shop_category_desc` varchar(1024) DEFAULT NULL,
	`shop_category_img`  varchar(1024) DEFAULT NULL,
	`create_time`        datetime      DEFAULT NULL,
	`last_edit_time`     datetime      DEFAULT NULL,
	PRIMARY KEY (`shop_category_id`),
	constraint `fk_shop_category_id` foreign key (`parent_id`) references `tb_shop_category` (`shop_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


create table `tb_shop`
(
	`shop_id`          int(10) NOT NULL AUTO_INCREMENT,
	`owner_id`         int(10) NOT NULL COMMENT '商店創建人',
	`area_id`          int(2) NOT NULL,
	`shop_category_id` int(10) NOT NULL,
	`shop_name`        varchar(100)  DEFAULT NULL,
	`shop_desc`        varchar(1024) DEFAULT NULL,
	`shop_addr`        varchar(128)  DEFAULT NULL,
	`shop_img`         varchar(1024) DEFAULT NULL,
	`phone`            varchar(128)  DEFAULT NULL,
	`priority`         int(3) NOT NULL DEFAULT '0',
	`enable_status`    int(2) NOT NULL DEFAULT '0',
	`create_time`      datetime      DEFAULT NULL,
	`last_edit_time`   datetime      DEFAULT NULL,
	`advice`           varchar(255)  DEFAULT NULL,
	primary key (`shop_id`),
	constraint `fk_shop_owner_id` foreign key (`owner_id`) references `tb_person_info` (`user_id`),
	constraint `fk_shop_area_id` foreign key (`area_id`) references `tb_area` (`area_id`),
	constraint `fk_shop_shop_category_id` foreign key (`shop_category_id`) references `tb_shop_category` (`shop_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


create table `tb_product_category`
(
	`product_category_id`   int(11) NOT NULL AUTO_INCREMENT,
	`shop_id`               int(10) NOT NULL,
	`product_category_name` varchar(100) DEFAULT NULL,
	`priority`              int(3) NOT NULL DEFAULT '0',
	`create_time`           datetime     DEFAULT NULL,
	PRIMARY KEY (`product_category_id`),
	constraint `fk_product_category_shop_id` foreign key (`shop_id`) references `tb_shop` (`shop_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


create table `tb_product`
(
	`product_id`          int(11) NOT NULL AUTO_INCREMENT,
	`product_category_id` int(11) NOT NULL,
	`shop_id`             int(10) NOT NULL,
	`product_name`        varchar(100)  DEFAULT NULL,
	`product_desc`        varchar(2000) DEFAULT NULL,
	`img_addr`            varchar(1024) DEFAULT NULL,
	`normal_price`        int(10) DEFAULT NULL,
	`promotion_price`     int(10) DEFAULT NULL,
	`priority`            int(3) NOT NULL DEFAULT '0',
	`create_time`         datetime      DEFAULT NULL,
	`last_edit_time`      datetime      DEFAULT NULL,
	`enable_status`       int(2) NOT NULL DEFAULT '0' COMMENT '0:下架,1.上架',
	primary key (`product_id`),
	constraint `fk_product_product_category_id` foreign key (`product_category_id`) references `tb_product_category` (`product_category_id`),
	constraint `fk_product_shop_id` foreign key (`shop_id`) references `tb_shop` (`shop_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


create table `tb_product_img`
(
	`product_img_id` int(11) NOT NULL AUTO_INCREMENT,
	`product_id`     int(11) NOT NULL,
	`img_addr`       varchar(1024) DEFAULT NULL,
	`img_desc`       varchar(1024) DEFAULT NULL,
	`priority`       int(3) NOT NULL DEFAULT '0',
	`create_time`    datetime      DEFAULT NULL,
	PRIMARY KEY (`product_img_id`),
	constraint `fk_product_img_product_id` foreign key (`product_id`) references `tb_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
