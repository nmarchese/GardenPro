var app = angular.module('ngGarden');

var seedsComponentController = function(gardenService, $rootScope){
  var vm = this;

  vm.plantSeed = function(planting) {
    var qty = parseInt($('#seedqty'+planting.id).val());
    if(planting.qty === qty) {
      planting.stage = 1;
      gardenService.updatePlanting(planting)
      .then(function(){
        vm.plant_form_hide(planting);
        $rootScope.$broadcast('reminderUpdateEvent');
      })
      .then(vm.loadData);
    } else {
      planting.qty = (planting.qty - qty);
      gardenService.updatePlanting(planting)
      .then(function(){
        $rootScope.$broadcast('reminderUpdateEvent');
      })
      .then(vm.loadData);
      gardenService.createPlanting(planting.plant,qty,1)
      .then(function(){
        vm.plant_form_hide(planting);
        $rootScope.$broadcast('reminderUpdateEvent');
      })
      .then(vm.loadData);
    }
  };

  vm.transplantSeed = function(planting) {
    var qty = parseInt($('#transplantqty'+planting.id).val());
    if(planting.qty === qty) {
      planting.stage = 4;
      gardenService.updatePlanting(planting)
      .then(function(){
        $rootScope.$broadcast('reminderUpdateEvent');
      })
      .then(vm.loadData);
    } else {
      planting.qty = (planting.qty - qty);
      gardenService.updatePlanting(planting)
      .then(function(){
        $rootScope.$broadcast('reminderUpdateEvent');
      })
      .then(vm.loadData);
      gardenService.createPlanting(planting.plant,qty,4)
      .then(function(){
        vm.transplant_form_hide(planting);
        $rootScope.$broadcast('reminderUpdateEvent');
      })
      .then(vm.loadData);
    }
  };

  vm.deleteSeed = function(planting) {
    gardenService.deletePlanting(planting)
    .then(function(){
      $rootScope.$broadcast('reminderUpdateEvent');
    })
    .then(vm.loadData);
  };

  vm.isSeed = function(seed) {
    if (seed.stage === 0) {
      return true;
    } else {
      return false;
    }
  };

  vm.plant_form_show = function(seed) {
    document.getElementById("seed"+seed.id).style.display = "block";
  };
  vm.plant_form_hide = function(seed) {
    document.getElementById("seed"+seed.id).style.display = "none";
  };

  vm.transplant_form_show = function(seed) {
    document.getElementById("transplant"+seed.id).style.display = "block";
  };
  vm.transplant_form_hide = function(seed) {
    document.getElementById("transplant"+seed.id).style.display = "none";
  };

  vm.plant_detail_show = function(seed) {
    document.getElementById("detail"+seed.id).style.display = "block";
  };
  vm.plant_detail_hide = function(seed) {
    document.getElementById("detail"+seed.id).style.display = "none";
  };

  vm.noSeeds = function(garden){
    if(garden.length === 0) {
      document.getElementById("noSeeds").style.display = "block";
    } else {
      document.getElementById("noSeeds").style.display = "none";
    }
  };
};

app.component('seedsComponent', {
  template : `
  {{$ctrl.noSeeds($ctrl.garden | seedFilter:true)}}
  <div class="plantings-box" id="seed-box">
    <div class="seed stage{{seed.stage}}" ng-repeat="seed in $ctrl.garden | seedFilter:$ctrl.showSeeds | orderBy:'commonName'">
      <h3><a class="plantDetailClick" ng-click="$ctrl.plant_detail_show(seed)">{{seed.plant.commonName}}</a></h3>
      <div class="imgStage{{seed.stage}}" style="width: 50px; height: 50px;"></div>

      <h4>Quantity: {{seed.qty}}</h4>
      <h4>Stage: {{$ctrl.showDetail(seed.stage)}}</h4>
      <button class="plant-button btn btn-primary" ng-click="$ctrl.plant_form_show(seed)" ng-show="$ctrl.isSeed(seed)">Plant</button>
      <button class="transplant-button btn btn-primary" ng-click="$ctrl.transplant_form_show(seed)" ng-hide="$ctrl.isSeed(seed)">Transplant</button>
      <button class="delete btn btn-danger" ng-click="$ctrl.deleteSeed(seed)">Delete</button>

      <div class="popup" id="seed{{seed.id}}">
        <div class="popupAddPlant">
        <form>
          <h3 class="popup-label">Planting {{seed.plant.commonName}} Seeds</h3>
          <p>
            <h4 class="popup-label">How Many?: <span class="black-text">
            <input class="qtyInput" type="number" min="0" max="{{seed.qty}}" step="1" required value="{{seed.qty}}" id="seedqty{{seed.id}}" name="qty"></span></h4>
          </p>
          <p>
            <button class="add btn btn-primary" ng-click="$ctrl.plantSeed(seed)">Plant</button>
            <button class="add btn btn-danger" ng-click="$ctrl.plant_form_hide(seed)">Cancel</button>
          </p>
        </form>
        </div>
      </div>

      <div class="popup" id="transplant{{seed.id}}">
        <div class="popupAddPlant">
        <form>
          <h3 class="popup-label">Transplanting <br> {{seed.plant.commonName}} Plants</h3>
          <p>
            <h4 class="popup-label">How Many?: <span class="black-text">
            <input class="qtyInput" type="number" min="0" max="{{seed.qty}}" step="1" required value="{{seed.qty}}" id="transplantqty{{seed.id}}" name="qty"></span></h4>
          </p>
          <p class="popup-label italic" ng-show="{{seed.stage < 3}}"><span class="warn">Warning:</span> This plant may be too young to move outside.</p>
          <p>
            <button class="add btn btn-primary" ng-click="$ctrl.transplantSeed(seed)">Plant</button>
            <button class="add btn btn-danger" ng-click="$ctrl.transplant_form_hide(seed)">Cancel</button>
          </p>
        </form>
        </div>
      </div>

      <div class="popup" id="detail{{seed.id}}">
        <div class="popupAddPlant detailPopup">
        <form>
          <h3 class="popup-label">{{seed.plant.commonName}} Detail</h3>
          <h4>Botanical Name: {{seed.plant.botanicalName}}</h4>
          <h4>Variety: {{seed.plant.variety}}</h4>
          <h4>Sowing Instructions: {{seed.plant.sowingMethod}}</h4>
          <h4>Type: {{$ctrl.showDetail(seed.plant.type)}}</h4>
          <h4>Life Cycle: {{$ctrl.showDetail(seed.plant.life)}}</h4>
          <h4>Germination: Weeks {{seed.plant.startGerm}}-{{seed.plant.endGerm}}</h4>
          <h4>Sowing Depth: {{seed.plant.depth}}in.</h4>
          <h4>Plant Spacing: {{seed.plant.space}}in.</h4>
          <h4>Time to Harvest: {{seed.plant.timeToHarvest}}</h4>
          <h4>Required Sun: {{$ctrl.showDetail(seed.plant.transplant)}}</h4>
          <h4>Zones: {{seed.plant.zones}}</h4>
          <h4>Comments: {{seed.plant.comment}}</h4>
          <p>
            <button class="add btn btn-primary" ng-click="">Edit</button>
            <button class="add btn btn-danger" ng-click="$ctrl.plant_detail_hide(seed)">Cancel</button>
          </p>
        </form>
        </div>
      </div>

    </div>

    <div id="noSeeds">
      <h2>You don't have any Seeds yet.</h2>
      <h3>To add Seeds, either click the "Add New Seeds" button, or click the
      "Add Plants" button and select the Seeds you would like to add.</h3>
    </div>

  </div>
  `,

  controller : seedsComponentController,

  bindings : {
    garden: '=',
    showSeeds: '<',
    loadData: '<',
    showDetail: '<'
  }
});
