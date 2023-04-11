/**
 * Вспомогательная функция, которая делит коллекцию на части
 *
 * @param {Array} db Исходный массив объектов
 * @param {Number} chunk Делитель массива
 * @returns {Array} Возвращает новый массив объектов
 */
export const chunkArray = (db, chunk) => {
  const newArray = [];

  for (let i = 0; i < db.length; i += chunk) {
    newArray.push(db.slice(i, i + chunk));
  }

  return newArray;
};

/**
 * Вспомогательная функция-предикат. Определяет, есть ли пользователь в массиве через 'id'
 *
 * @param {Array} db Исходный массив объектов
 * @param {Object} from Пользователь в виде объекта
 * @returns {Boolean} Возвращает 'true' или 'false'
 */
export const isParticipant = (db, from) => db.some((person) => person.id === from.id);
