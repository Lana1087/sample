<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon as Carbon;
use App\Helpers\Tools;
use App\Helpers\ValidateTools;
use App\Modules\BolDaily\Models\BolDaily;
use App\Modules\BillOfLanding\Models\BillOfLanding;

class GenerateBolDaily extends Command{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'custom:generate_bol_daily';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate bill of landing report daily';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle(){
        $this->comment('[+] Begin execute...');
        $firstBol = BillOfLanding::orderBy('created_at', 'asc')->first();

        $now = Tools::nowDate();
        $lowestDate = Tools::nowDate();
        if($firstBol){
            $lowestDate = $firstBol->created_at;
        }

        while(true){
            BolDaily::updateByDate($lowestDate);
            if(abs($lowestDate->diffInDays($now)) === 0){
                break;
            }
            $lowestDate = $lowestDate->addDay();
        }

        $this->comment('[+] DONE');
    }
}
