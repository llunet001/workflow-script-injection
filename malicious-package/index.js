// Dummy module - the real attack happens in postinstall.js
module.exports = {
  authenticate: () => {
    console.log("Fake auth module loaded");
    return true;
  },
};
