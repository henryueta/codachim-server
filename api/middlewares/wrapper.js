
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.log(error);
    return res.status(500).send({ message: 'Ocorreu um erro interno no servidor.' });
  });
};

module.exports = {
    asyncWrapper
};