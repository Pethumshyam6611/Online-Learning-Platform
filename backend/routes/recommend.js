const express = require('express');
const router = express.Router();

const recommendController = require('../controllers/recommendController');


module.exports = (logRequest) => {
  
  router.post('/', (req, res, next) => {
  
    req.logRequest = logRequest;
    next();
  }, recommendController.getRecommendation); // Call controller to handle recommendation
  return router;
};