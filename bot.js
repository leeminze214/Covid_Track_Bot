const fetch = require('node-fetch');
const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json')
const token = auth.discordToken
const signature = auth.signature
const gen_url = 'https://disease.sh/v2/all?yesterday'
const country_url = 'https://disease.sh/v2/countries?yesterday%20=%20False%20&sort'
const avail_countries = []


//get the list of countries that have stats available
async function get_con_names(){
  const all_countries = await fetch(country_url)
  const all_in_json = await all_countries.json()
  for (var i = 0; i < all_in_json.length; i++) {
    avail_countries.push(all_in_json[i].country)
  }
};
//see what the global data looks like
async function data (){
  var stats = await fetch(gen_url)
  var gen_stats = await stats.json()
  console.log(gen_stats)
};

//to  add commas and percentages to better present data
function percentages_clean(dataset,data){
  var decimal = data/dataset.cases
  if (decimal < 0.001){
    decimal = "nearly 0"
  }
  else{
    decimal = (decimal*100).toString().slice(0,5)
  }
  return [clean_up(data),"    ("+decimal+"% of Total Cases)"]
};

// commas
function clean_up(data){
  var res = []
  var lst_data = data.toString().split("")
  while (lst_data.length >= 4){
    res.push(lst_data.slice(-3))
    lst_data = lst_data.slice(0,-3)
  }
  res.push(lst_data)
  for (var i = 0; i < res.length; i++) {
    res[i] = res[i].join("")
  }
  return res.reverse().join(",")
}

//get percentage of total cases --> total pop
function percentage_total(dataset){
  var percent = "    ("+(dataset.cases/dataset.population*100).toString().slice(0,5)+"% of Population)"
  return [clean_up(dataset.cases),percent]
}

client.on('ready', () => {
  console.log(`Logged in as Hopechatbot!`);
  get_con_names()
});


client.on('message', msg => {
  if(msg.content.substring(0,signature.length) == signature){
  const refined = msg.content.substring(signature.length);

  if (refined.startsWith("global")){
    global(msg)
    console.log("received global request")
  }

  else if(refined.startsWith("symptoms")){
    symptoms(msg)
    console.log("received symptoms request")
  }
  else if (refined.startsWith("preventions")){
    preventions(msg)
    console.log("received preventions request")
  }
  else if (refined.startsWith("funfact")){
    funfact(msg)
    console.log("received funfact request")
  }
  else if (refined.startsWith("help")){
    help(msg)
    console.log("received help request")
  }
  else{
    var name = refined.toUpperCase()
    //preventing error for special cases such as USA, where all 3 are cap
    var normal_names = refined.toLowerCase().split(" ")
    for (var i = 0; i < normal_names.length; i++) {
      normal_names[i] = normal_names[i][0].toUpperCase()+normal_names[i].substring(1)
    };
    var name1 = normal_names.join(" ")
    if (avail_countries.includes(name1)){
      country(msg,name1)
      console.log("received country request")
    }
    else if (avail_countries.includes(name)){
      country(msg,name)
      console.log("received country request")
    }
    else{
      msg.reply("Sorry, Invalid request! (need help? --> 'cs?help') ")
    }
    }
    }
  }
);

//if GENERAL world wide
async function global(msg){
  var stats = await fetch(gen_url)
  var gen_stats = await stats.json()
  var embed = new Discord.MessageEmbed();
  embed.setTitle("World Wide Stats");
  embed.setColor(0xff0000);
  embed.addFields(
    {name:"Countries affected: ", value: gen_stats.affectedCountries},
    {name:"Population: ", value: clean_up(gen_stats.population)},
    {name:"Cases",value:["Total Cases: "+percentage_total(gen_stats),
    "Active Cases: "+clean_up(gen_stats.active),"Today's Cases: "+clean_up(gen_stats.todayCases)]},
    {name:"Deaths",value:["Total Deaths: "+percentages_clean(gen_stats,gen_stats.deaths),
    "Today's Deaths: "+clean_up(gen_stats.todayDeaths)]},
    {name:"Recovered",value:["Total Recovered: "+percentages_clean(gen_stats,gen_stats.recovered),
    "Today's Recovered: "+clean_up(gen_stats.todayRecovered)]}
  );
  msg.reply(embed);
};
//if user asks for specific country stats
async function country(msg,country_name) {
  var stats = await fetch(country_url)
  var country_stats_in_json = await stats.json()
  //find the country's data by looping
  for (var i = 0; i != country_stats_in_json.length; i++) {
    if (country_stats_in_json[i].country == country_name){
      var country = country_stats_in_json[i];
      var embed = new Discord.MessageEmbed();
      embed.setTitle("Covid-19 statistics for " + country_name);
      embed.setColor(0xff0000);
      embed.addFields(
        {name:"Population: ", value: clean_up(country.population)},
        {name:"Cases",value: ["Total Cases: "+percentage_total(country),
          "Active Cases: "+clean_up(country.active), "Today's Cases: "+clean_up(country.todayCases)]},
          {name:"Deaths",value: ["Total Deaths: "+percentages_clean(country,country.deaths),
          "Today's Deaths: "+clean_up(country.todayDeaths)]},
          {name:"Recovered", value:["Total Recovered: "+percentages_clean(country,country.recovered),
          "Today's Recovered: "+clean_up(country.todayRecovered)]}
        )
      embed.setThumbnail(country.countryInfo.flag)
      msg.reply(embed)
      break
    }
  }
};

//if symptoms --> symptoms
function symptoms(msg){
  var embed = new Discord.MessageEmbed();
  embed.setTitle("Symptons of Covid-19");
  embed.setColor(0xff0000);
  //embed.discription("Coronavirus spread very easily, and you may have it as symptoms
  //take up to 1-15 days to show up")
  embed.addFields(
    {name:"Here are symptoms for Covid-19",value:["Common Cold","Chest Pain","Itchy/Sore throat"
    ,"Fever"],inline:true},
    {name:"To perform a self assessment:", value:"[ Press here ](" + 'https://www.surveymonkey.com/r/nwt-covid19-self-assessment' + ")"}
  );
  msg.reply(embed);
};

function preventions(msg){
  var embed = new Discord.MessageEmbed();
  embed.setTitle("Prevention for Covid-19");
  embed.setColor(0xff0000);
  embed.addFields(
    {name:"Here are ways to prevent Covid-19",value:["wash hands","limlit travling"],inline:true},
    {name:"For more prevention tips:", value:"[ Press here ](" + 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public' + ")"}
  );
  msg.reply(embed);
};

function funfact(msg){
  msg.reply("TESING, here is a funfact")
};

function help(msg){
  var embed = new Discord.MessageEmbed();
  embed.setTitle("Commands for HopeChatBot (Prefix: 'cs?')");
  embed.setColor(0xff0000);
  embed.addFields(
    {name:"For global Covid-19 statistics",value:"cs?global"},
    {name:"For a country's Covid-19 statistics",value:"cs?<country_name>"},
    {name:"For Covid-19 prevention tips", value:"cs?preventions"},
    {name:"For Covid-19 symptoms and self_assessment", value:"cs?symptoms"},
    {name:"more",value:"more"},
    {name:"more",value:"more"}
  );
  msg.reply(embed);
};

client.login(token);
