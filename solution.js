<script>

$(window).on('load', function() { 
   //$('#warningModal').modal('show'); 
   console.log("caraca");
} );

//The entire solution to be calculated
var solution = 
{
  inverterModel   : "", inverterCount   : 0, // Inverter
  battery    : "", batteryCount    : 0, // Battery
  bmsPBoxModel    : "", bmsPBoxCount    : 0, // BMS Parallel Box
  mateboxModel    : "", mateboxCount    : 0, // Matebox 
  epsPBoxModel    : "", epsPBoxCount    : 0, // EPS Parallel Box
  smartMeterModel : "", smartMeterCount : 0, // Smart Meter  
  evcModel        : "", evcCount        : 0  // Electric Vehicle Charger
}

//======================= GRID STANDARDS *********************
const grid = 
{
  singlePhase: 1, splitPhase: 2, threePhase: 3,
  voltage_220V: 220, voltage_380V: 380,
  frequency_60Hz: 60 
}

//*********************== INVERTER *********************===
const hybrid = 
{
  singlePhase:
  {
    singleInverter: 1.0,
    X1_G4: // 220V L-N
    { 
      modelPrefix: "X1-HYBRID-", modelSuffix: "-D", // Full Model name: Prefix-Nominal Power-Suffix
      nominalPowerKW: ["3.0", "3.7", "4.6", "5.0", "6.0", "7.5"] ,
      maxEPSParallel: 2.0,
      batteryChannels: 1
    }, 

    X1_SPT: //110V L-N & 220V L-L
    { 
      modelPrefix: "X1-SPT-", modelSuffix: "-D", // Full Model name: Prefix-Nominal Power-Suffix
      nominalPowerKW: ["3.0", "3.6", "6.0", "7.0"],
      maxEPSParallel: 2.0,
      batteryChannels: 1 
    }, 
    maxEPSParallel: 2.0
  },

  threePhase:
  {
    X3_G4:
    {
      modelPrefix: "X3-HYBRID-", modelSuffix: "-D",
      nominalPowerKW: ["5.0", "6.0", "8.0", "10.0", "12.0", "15.0"],
      maxEPSParallel: 10.0, 
      batteryChannels: 1
    },

    X3_G4_LV:
    {
      modelPrefix: "X3-HYBRID-", modelSuffix: "-LV",
      nominalPowerKW: ["5.0", "8.3"],
      maxEPSParallel: 10.0, 
      batteryChannels: 1
    }

  }
};


function selectInverter(loadsPowerKW, ratedEnergyKWH, gridType){
  switch(gridType){

    case grid.singlePhase: // single-phase 220V
      selectSinglePhaseInverter(loadsPowerKW, ratedEnergyKWH);
      batteryForInverter(ratedEnergyKWH, hybrid.singlePhase.X1_G4, highVoltageBatteries.T58);
    break;

    case grid.splitPhase: // split-phase 220V 

    break;
    
    case grid.threePhase: // three-phase 220V

    break;
  }
};

/******************************************************************
 * 
*******************************************************************/
function selectSinglePhaseInverter(loadsPowerKW, ratedEnergyKWH, inverter)
{
  inverter.nominalPowerKW.every(
    function (powerKW)
    {
      if( powerKW >= loadsPowerKW)
      {
        solution.inverterModel = inverter.modelPrefix + powerKW + inverter.modelSuffix;
        solution.inverterCount = inverter.singleInverter;
        console.log(solution);
        return false;
      }
      return true;
    }
  );
  
  if(solution.inverterCount == inverter.singleInverter) return;
  
  inverter.nominalPowerKW.every( 
  function (powerKW)
  {
    if( (powerKW * inverter.maxEPSParallel) >= loadsPowerKW )
    {
      solution.inverterModel = inverter.modelPrefix + powerKW + inverter.modelSuffix;
      solution.inverterCount = inverter.maxEPSParallel;
      console.log(solution);
      return false;
    }
    return true;
  });

  return "Paralelo";
}

function selInverter2P(loadsPowerKW, ratedEnergyKWH){

}

/*********************** BATTERY **********************
 * https://www.solaxpower.com/products/t-bat-sys-hv-3-0/
 * https://www.solaxpower.com/products/t-bat-sys-hv-5-8/
 */

const battery = 
{
  highVoltage: 
  { 
     T30:
    {
      nickname: "T30",
      standardPowerKW : 2.5, 
      nominalEnergyKWH: 3.0, 
      usefulEnergyKWH : 2.8,
      X1_G4_min: 1,
      X1_G4_Max: 4,
      X3_G4_min: 2,
      X3_G4_Max: 4
    },

    T58:
    {
      nickname: "T58",
      standardPowerKW: 2.8, 
      nominalEnergyKWH: 5.8, 
      usefulEnergyKWH: 5.1,
      X1_G4_min: 1, 
      X1_G4_Max: 3,
      X3_G4_min: 2, 
      X3_G4_Max: 4
    }
  }
};

/* BMS Parallel Box II
* https://www.solaxpower.com/uploads/file/bms-parallel-box-datasheet-en.pdf
*/
const bmsParallelBoxII = 
{
  nickname: "BMS-Parallel Box-II",
  compatibleWith: battery.highVoltage.T58,
  batteryChannels: 2
}

/******************************************************************
 * 
 * 
*******************************************************************/
function batteryForInverter(loadsEnergyKWH, inverter, battery)
{  
  if(maxBatEnergyKWH(inverter, bmsParallelBoxII, battery) > loadsEnergyKWH)
  {
    return false;
  }

  let numBatteries = Math.ceil( loadsEnergyKWH / battery.usefulEnergyKWH );

  if(numBatteries > battery.X1_G4_Max && ( numBatteries <= (battery.X1_G4_Max * bmsParallelBoxII.batteryChannels) ))
  {
    solution.bmsPBoxModel = bmsParallelBoxII.nickname;
    solution.bmsPBoxCount = inverter.batteryChannels; 
    return true; 
  }
  return true;
}

/******************************************************************
 * 
 * 
*******************************************************************/
function maxBatEnergyKWH(inverter, bmsBoxII, battery){
  let maxSeriesBatteries = 0.0;
  
  switch(inverter)
  {
    case hybrid.singlePhase.X1_G4:
      maxSeriesBatteries = battery.X1_G4_Max; 
    break;
    case hybrid.threePhase.X3_G4:
      maxSeriesBatteries = battery.X3_Hybrid_G4_Max;
    default:
  }
  if(bmsBoxII.compatibleWith == battery)
    return maxSeriesBatteries * bmsBoxII.batteryChannels * inverter.batteryChannels * battery.usefulEnergyKWH;
  else
    return maxSeriesBatteries * inverter.batteryChannels * battery.usefulEnergyKWH;    
}

</script>
