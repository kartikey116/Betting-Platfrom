const orderMap = {
  "1":1,"2":2,"3":3,"4":4,"5":5,
  "6":6,"7":7,"8":8,"9":9,"0":10
};

/* =========================
   SORT PANNA
========================= */
const sortPanna = (num)=>{
  return num
    .split("")
    .sort((a,b)=>orderMap[a]-orderMap[b])
    .join("");
};



/* =========================
   VALIDATE BET INPUT
========================= */
const validateBet = (type,num)=>{

  if(!num) return "Number required";

  if(!/^\d+$/.test(num))
    return "Digits only allowed";


  switch(type){

    /* ---------- SINGLE DIGIT ---------- */
    case "single_digit":
      if(num.length!==1)
        return "Single digit must be 0-9";
      return null;



    /* ---------- JODI ---------- */
    case "jodi":
      if(num.length!==2)
        return "Jodi must be 2 digits (00-99)";
      return null;



    /* ---------- PANNA TYPES ---------- */
    case "single_panna":
    case "double_panna":
    case "triple_panna":

      if(num.length!==3)
        return "Panna must be 3 digits";

      const digits = num.split("");
      const unique = new Set(digits).size;

      if(type==="single_panna" && unique!==3)
        return "Single panna must have 3 unique digits";

      if(type==="double_panna" && unique!==2)
        return "Double panna must have exactly 2 same digits";

      if(type==="triple_panna" && unique!==1)
        return "Triple panna must have all digits same";

      return null;



    default:
      return "Invalid bet type";
  }
};



/* =========================
   NORMALIZE NUMBER
========================= */
const normalizeNumber = (type,num)=>{

  if(type.includes("panna"))
    return sortPanna(num);

  return num;
};



module.exports = {
  validateBet,
  normalizeNumber
};