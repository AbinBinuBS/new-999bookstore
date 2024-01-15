const errorHandler = (err, req, res, next) => {
  console.log("hai i am atattttt here");
  console.error(err.stack);
  res.render("../views/admin/500page");
};

module.exports = { errorHandler };
