import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const salt = Number(process.env.PASSWORD_SALT);

type user = {
  id: number;
  role: string;
  username: string;
  password: string;
};

const dataUsers: user[] = [
  {
    id: 0,
    role: 'bot',
    username: 'bot',
    password: 'bot',
  },
  {
    id: 1,
    role: 'admin',
    username: 'Alice',
    password: bcrypt.hashSync('Alice', salt),
  },
  {
    id: 2,
    role: 'player',
    username: 'Bob',
    password: bcrypt.hashSync('Bob', salt),
  },
  {
    id: 3,
    role: 'player',
    username: 'John',
    password: bcrypt.hashSync('John', salt),
  },
];

type sheep = {
  id: number;
  name: string;
  length: number;
};

const dataSheeps: sheep[] = [
  {
    id: 1,
    name: 'линкор',
    length: 4,
  },
  {
    id: 2,
    name: 'крейсер',
    length: 3,
  },
  {
    id: 3,
    name: 'эсминец',
    length: 2,
  },
  {
    id: 4,
    name: 'катер',
    length: 1,
  },
];

type rule = {
  id: number;
  sheepId: number;
  quantity: number;
};

const rules: rule[] = [
  {
    id: 1,
    sheepId: 1,
    quantity: 1,
  },
  {
    id: 2,
    sheepId: 2,
    quantity: 2,
  },
  {
    id: 3,
    sheepId: 3,
    quantity: 3,
  },
  {
    id: 4,
    sheepId: 4,
    quantity: 4,
  },
];

Promise.all([
  ...dataUsers.map(async (item: user) => {
    const { id, ...data } = item;
    await prisma.user.upsert({
      where: { id },
      update: data,
      create: item,
    });
  }),
  ...dataSheeps.map(async (item: sheep) => {
    const { id, ...data } = item;
    await prisma.sheep.upsert({
      where: { id },
      update: data,
      create: item,
    });
  }),
])
  .then(() => {
    Promise.all(
      rules.map(async (item: rule) => {
        const { id, ...data } = item;
        await prisma.rule.upsert({
          where: { id },
          update: data,
          create: item,
        });
      }),
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
