<?php

namespace App\Modules\UserTransaction\Controllers;

use Validator;
use App\Modules\UserTransaction\Models\UserTransaction;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Helpers\ResTools;
use App\Helpers\ValidateTools;
use App\Helpers\Tools;
use App\Helpers\AmazonECS;

use ApaiIO\UserTransactionuration\GenericUserTransactionuration;
use ApaiIO\Operations\Search;
use ApaiIO\ApaiIO;

class UserTransactionController extends Controller{

    /**
     * Create a new authentication controller instance.
     *
     * @return void
     */
    public function __construct(){
        # parent::__construct();
    }

    public function obj(Request $request){
        $id = intval(Tools::getProp($request->all(), 'id'));
        $result = UserTransaction::obj($id);
        return Tools::jsonResponse($result);
    }

    public function list(Request $request){
        $input = ValidateTools::listInput($request->all(), new UserTransaction);

        if(!array_key_exists('user_id', $input[0])){
            $input[0]['user_id'] = ValidateTools::getRequestValue($request, 'user_id', 'int', null);
        }

        $input[0]['chamsoc'] = false;
        if($request->token->role_type === 'user'){
            $input[0]['user_id'] = $request->token->parent->id;
        }else{
            $input[0]['admin_id'] = ValidateTools::getRequestValue($request, 'admin_id', 'int', null);
            $role = $request->token->role;
            if($role === config('app.chamsoc')){
                $input[0]['chamsoc_id'] = $request->token->parent->id;
                $input[0]['chamsoc'] = true;
            }
        }
        $input[0]['type'] = ValidateTools::getRequestValue($request, 'type', 'str', null);
        $input[0]['note'] = ValidateTools::getRequestValue($request, 'note', 'str', null);
        $input[0]['from_amount'] = ValidateTools::getRequestValue($request, 'from_amount', 'int', null);
        $input[0]['to_amount'] = ValidateTools::getRequestValue($request, 'to_amount', 'int', null);
        $input[0]['date_range'] = ValidateTools::getRequestValue($request, 'date_range', 'str', null);

        $result = UserTransaction::list(...$input);
        return Tools::jsonResponse($result);
    }

    public function addItem(Request $request){
        $input = ValidateTools::validateData(
            $request->all(), UserTransaction::$fieldDescriptions
        );
        $result = UserTransaction::addItem($input['success']?$input['data']:$input, $request->token->parent);
        return Tools::jsonResponse($result);
    }

    public function editItem(Request $request){
        $id = intval(Tools::getProp($request->all(), 'id'));
        $input = ValidateTools::validateData(
            $request->all(), UserTransaction::$fieldDescriptions
        );
        $result = UserTransaction::editItem($id, $input['success']?$input['data']:$input, $request->token->parent);
        return Tools::jsonResponse($result);
    }

    public function removeItem(Request $request){
        $id = (string)Tools::getProp($request->all(), 'id');
        $result = UserTransaction::removeItem($id);
        return Tools::jsonResponse($result);
    }

    public static function rate(Request $request){
        $result = [
            'rate' => intVal(UserTransaction::get('cny-vnd', 3500))
        ];
        return response()->json(ResTools::obj($result));
    }

    public static function testAmazon(Request $request){
        $conf = new GenericUserTransactionuration();
        $client = new \GuzzleHttp\Client();
        $request = new \ApaiIO\Request\GuzzleRequest($client);

        $conf
            ->setCountry('com')
            ->setAccessKey('AKIAIRIHFHJNIJR3OGCA')
            ->setSecretKey('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')
            ->setAssociateTag('tbson87-20')
            ->setRequest($request)
            ->setResponseTransformer(new \ApaiIO\ResponseTransformer\XmlToArray());
        $apaiIO = new ApaiIO($conf);

        $search = new Search();
        $search->setCategory('Electronics');
        # $search->setActor('Bruce Willis');
        $search->setKeywords('ipad');
        $search->setItemPage(1);
        $search->setResponsegroup(array('Offers', 'Images', 'Reviews'));

        $formattedResponse = $apaiIO->runOperation($search);

        return response()->json($formattedResponse);
        /*
        'All','Wine','Wireless','ArtsAndCrafts','Miscellaneous','Electronics','Jewelry','MobileApps','Photo','Shoes','KindleStore','Automotive','Vehicles','Pantry','MusicalInstruments','DigitalMusic','GiftCards','FashionBaby','FashionGirls','GourmetFood','HomeGarden','MusicTracks','UnboxVideo','FashionWomen','VideoGames','FashionMen','Kitchen','Video','Software','Beauty','Grocery',,'FashionBoys','Industrial','PetSupplies','OfficeProducts','Magazines','Watches','Luggage','OutdoorLiving','Toys','SportingGoods','PCHardware','Movies','Books','Collectibles','Handmade','VHS','MP3Downloads','Fashion','Tools','Baby','Apparel','Marketplace','DVD','Appliances','Music','LawnAndGarden','WirelessAccessories','Blended','HealthPersonalCare','Classical'
        */


        /*
        $client = new AmazonECS(
            'AKIAIRIHFHJNIJR3OGCA',
            'nxZHo0XpHuSvAFbZXkBdsKQi0dGtqNUnu87Kgemo',
            'com',
            'tbson87-20'
        );
        $response  = $client->category('Books')->search('PHP 5');
        return response()->json($response);
        */
    }
}