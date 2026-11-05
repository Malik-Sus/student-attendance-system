function submitResponsesToForm() {
  // Use the Editor ID, NOT the public view URL. 
  // The ID you provided earlier is correct for the script!
  var form = FormApp.openById("1zL4b6W6u8j150LZCUvmRW_kzy-liFGORhqjJWcGwRe0");

  var responses = [
    ["18–25","Male","Weight loss","68","175","3–4 days","Walking","Yes","Charts/Graphs","Stay healthy","Yes"],
    ["26–35","Female","Muscle gain","75","162","1–2 days","Gym workout","No","Weekly reports","More energy","Maybe"],
    ["36–50","Male","Maintain fitness","80","170","Rarely","Walking","No","Daily logs","Routine","No"],
    ["18–25","Female","Improve stamina","55","160","5+ days","Running, Sports","Yes","Charts/Graphs","Competition","Yes"],
    ["50+","Male","Maintain fitness","79","170","1–2 days","Walking","No","Weekly reports","Family support","Yes"],
    ["26–35","Male","Muscle gain","90","182","3–4 days","Gym workout","Yes","Daily logs","Strength improvement","Yes"],
    ["18–25","Female","Weight loss","62","158","3–4 days","Yoga, Walking","Maybe","Notifications","Confidence","Yes"],
    ["36–50","Female","Improve stamina","70","165","1–2 days","Walking","No","Weekly reports","Energy levels","Maybe"],
    ["26–35","Male","Other","85","176","5+ days","Sports, Running","Yes","Charts/Graphs","Sports performance","Yes"],
    ["18–25","Male","Weight loss","77","180","3–4 days","Gym workout","Yes","Daily logs","Appearance","Yes"],
    ["26–35","Female","Maintain fitness","60","155","1–2 days","Yoga","Maybe","Weekly reports","Routine","Maybe"],
    ["36–50","Male","Improve stamina","88","172","Rarely","Walking","No","Notifications","Doctor warning","Yes"],
    ["50+","Female","Maintain fitness","65","150","Rarely","Walking","No","Daily logs","Longevity","Yes"],
    ["18–25","Male","Muscle gain","72","177","5+ days","Gym workout","Yes","Charts/Graphs","Bodybuilding goal","Yes"],
    ["26–35","Female","Weight loss","68","164","3–4 days","Running","Yes","Weekly reports","Wedding prep","Yes"],
    ["36–50","Male","Maintain fitness","83","175","1–2 days","Walking","No","Daily logs","Stay active","Maybe"],
    ["18–25","Female","Improve stamina","59","162","5+ days","Sports","Yes","Charts/Graphs","Athletic goal","Yes"],
    ["26–35","Male","Weight loss","95","183","3–4 days","Gym workout","Maybe","Notifications","Health risk","Yes"],
    ["50+","Male","Maintain fitness","76","168","Rarely","Walking","No","Weekly reports","Doctor suggestion","Yes"],
    ["36–50","Female","Other","72","160","1–2 days","Yoga","Maybe","Daily logs","Flexibility","Maybe"],
    ["18–25","Male","Muscle gain","70","174","5+ days","Gym workout","Yes","Charts/Graphs","Strength","Yes"],
    ["26–35","Female","Weight loss","66","159","3–4 days","Running","Yes","Notifications","Confidence","Yes"],
    ["36–50","Male","Maintain fitness","81","171","1–2 days","Walking","No","Weekly reports","Routine","Maybe"],
    ["18–25","Female","Improve stamina","57","161","3–4 days","Sports","Yes","Daily logs","Competition","Yes"],
    ["50+","Female","Maintain fitness","69","156","Rarely","Walking","No","Weekly reports","Healthy aging","Yes"],
    ["26–35","Male","Muscle gain","92","185","5+ days","Gym workout","Yes","Charts/Graphs","Fitness passion","Yes"],
    ["36–50","Female","Weight loss","73","163","1–2 days","Yoga","Maybe","Notifications","Doctor advice","Yes"],
    ["18–25","Male","Improve stamina","64","178","3–4 days","Running","Yes","Daily logs","Endurance goal","Yes"],
    ["26–35","Female","Maintain fitness","61","160","3–4 days","Walking","Maybe","Weekly reports","Habit","Maybe"]
  ];

  var items = form.getItems();

  responses.forEach(function(row) {
    var response = form.createResponse();
    
    response.withItemResponse(items[0].asMultipleChoiceItem().createResponse(row[0]));
    response.withItemResponse(items[1].asMultipleChoiceItem().createResponse(row[1]));
    response.withItemResponse(items[2].asMultipleChoiceItem().createResponse(row[2]));
    response.withItemResponse(items[3].asTextItem().createResponse(row[3]));
    response.withItemResponse(items[4].asTextItem().createResponse(row[4]));
    response.withItemResponse(items[5].asMultipleChoiceItem().createResponse(row[5]));
    response.withItemResponse(items[6].asCheckboxItem().createResponse(row[6].split(", ")));
    response.withItemResponse(items[7].asMultipleChoiceItem().createResponse(row[7]));
    response.withItemResponse(items[8].asMultipleChoiceItem().createResponse(row[8]));
    response.withItemResponse(items[9].asParagraphTextItem().createResponse(row[9])); 
    response.withItemResponse(items[10].asMultipleChoiceItem().createResponse(row[10]));

    response.submit();
  });
}
