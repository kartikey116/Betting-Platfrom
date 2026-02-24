exports.emitEvent = (event, data) => {
  try {
    if (global.io) {
      global.io.emit(event, data);
    }
  } catch (err) {
    console.error("Socket emit error:", err.message);
  }
};