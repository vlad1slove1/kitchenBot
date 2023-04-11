import express from 'express';
import { config } from 'dotenv';
import { Telegraf, session } from 'telegraf';
import cron from 'node-cron';
import getMainMenu from './keyboards.js';
import { chunkArray, isParticipant } from './utils.js';

config();
const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

/**
 * В состоянии будет храниться число-делитель групп
 * (общее кол-во участников делится на делитель)
 */
bot.context.state = {
  membersInGroup: 8,
};

/**
 * БД в виде плоского массива объектов, где
 * каждый объект - пользователь со своими данными
 */
bot.context.db = [];

bot.use(session());

/**
 * При старте, для продолжения работы с ботом, нужно ввести пароль
 * если пароль верный, запускается меню
 */
bot.start((ctx) => {
  ctx.sendMessage(
    'Для входа введите пароль',
    {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: 'Введите пароль',
      },
    },
  ).then(() => {
    bot.hears(process.env.AUTH_PASS, (context) => context.replyWithHTML(
      'Добро пожаловать в <b>Kitchen bot</b>!\n\n'
    + 'Здесь мы формируем случайные группы для совместных обедов\n\n'
    + 'Наша цель - <b><i>сблизить друг друга</i></b> за одним столом! 👨‍💼🥗👩‍💼',
      getMainMenu(),
    ));
  }).then(() => {
    /**
     * В 9:30 с ПН-ПТ бот присылает уведомление
     */
    cron.schedule('30 9 * * 0-5', () => {
      const { id } = ctx.chat;
      const { db } = bot.context;
      const { length } = db;

      bot.telegram.sendMessage(
        id,
        `Осталось 30мин. до конца регистрации на обед!\n\nНас уже ${length}!`,
      );
    });
  });
});

/**
 * Комманда 'Участвовать  🙋🏼‍♂️' добавляет пользователя в коллекцию
 * если вы уже есть в коллекции, бот пришлёт сообщение
 */
bot.hears('Участвовать  🙋🏼‍♂️', (ctx) => {
  const { from } = ctx.message;
  const { db } = ctx;

  if (isParticipant(db, from)) {
    ctx.reply('Вы уже участвуете!');
  } else {
    db.push(from);

    ctx.replyWithHTML(
      'Наш бот подберёт вам компанию на обед.\n\n'
      + '<b><i>Проявите интерес к собеседнику, общайтесь на различные темы. Обсудите ваши впечатления или эмоции!</i></b>      💁‍♂️💬   🙋‍♀️ 🤷🙍🏻\n\n'
      + 'За час до обеда бот пришлёт оповещение!',
    );

    const { membersInGroup } = ctx.state;
    /**
     * В 10:00 с ПН-ПТ бот формирует группы из всех участников
     * и каждому участнику присылает уведомление о сформированных группах
     */
    cron.schedule('0 11 * * 0-5', () => {
      const groups = chunkArray(db, membersInGroup);

      groups.forEach((group) => {
        const participants = group.map((person) => [person.first_name, person.last_name]);
        const list = participants.map((person) => person.join(' ')).join('\n');

        ctx.replyWithHTML(
          'Группа:\n\n'
          + `${list}`,
        );
      });
    });
  }
});

/**
 * На комманду 'Список участников  👩‍💼👨‍💼🧑🏻‍💼' бот присылает уведомление
 * о текущем кол-ве пользователей в коллекции в виде списка
 */
bot.hears('Список участников  👩‍💼👨‍💼🧑🏻‍💼', (ctx) => {
  const { db } = ctx;

  if (db.length === 0) {
    ctx.reply('Список пуст.\nСтаньте первым участником!');
  } else {
    const participants = db.map((person) => [person.first_name, person.last_name]);
    const list = participants.map((person) => person.join(' ')).join('\n');

    ctx.reply(list);
  }
});

/**
 * На комманду 'Общее количество  🧮' бот присылает уведомление
 * о текущем кол-ве пользователей в коллекции в виде числа
 *
 * (удобно для повара, чтобы узнать на какое кол-во людей готовить)
 */
bot.hears('Общее количество  🧮', (ctx) => {
  const { db } = ctx;
  const { length } = db;

  ctx.reply(`Общее количество людей: ${length} чел.`);
});

/**
 * Комманда 'Не пойду  🚫' удаляет пользователя из коллекции
 *
 * (рассчитано на тот случай, если человек не пойдёт на обед,
 * но ранее ввёл комманду 'Участвовать  🙋🏼‍♂️')
 */
bot.hears('Не пойду  🚫', (ctx) => {
  const { from } = ctx.message;
  const { db } = ctx;
  const personId = ctx.update.message.from.id;

  if (!isParticipant(db, from)) {
    ctx.reply('Вы не состоите в группах!');
  } else {
    const filteredDatabase = db.filter((person) => person.id !== personId);
    bot.context.db = filteredDatabase;

    ctx.reply('Вы удалены из групп!');
  }
});

/**
 * В 15:00 с ПН-ПТ бот обнуляет коллекцию участников
 * ВНИМАНИЕ! Происходит замена текущей коллекции на пустую
 */
cron.schedule('0 15 * * 0-5', () => {
  const emptyArray = [];
  bot.context.db = emptyArray;
});

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});
bot.start((ctx) => {
  throw new Error(`Example error ${ctx}`);
});
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

app.listen(process.env.PORT);
