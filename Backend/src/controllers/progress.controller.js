const {getProgress}=require("../services/progress.service");

async function getProgressController(req,res){

const progress=await getProgress(req.user.id);

res.json(progress);

}

module.exports={

getProgressController

};