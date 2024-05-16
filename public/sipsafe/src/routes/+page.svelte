<script>
import { Info } from "lucide-svelte";
</script>    

<div class="max-h-screen flex flex-col">
    <header class="rounded-lg border-solid border-2 w-auto h-20 text-center p-4 mx-2 my-2">
        <div class="flex justify-between items-center">
            <h1 class="text-4xl font-bold">SipSafe Dashboard</h1>
            <label class="cursor-pointer grid place-items-center">
                <input type="checkbox" value="dark" class="toggle theme-controller bg-base-content row-start-1 col-start-1 col-span-2"/>
                <svg class="col-start-1 row-start-1 stroke-base-100 fill-base-100" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
                <svg class="col-start-2 row-start-1 stroke-base-100 fill-base-100" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </label>
        </div>
    </header>
    <main class="flex flex-wrap p-4 h-screen w-screen">
        <!-- Container for Analytics, Settings, and Logs -->
        <div class="flex justify-between w-full">
            <!-- Analytics Collumn -->
            <div class="rounded-lg border-dashed border-2 h-full md:w-1/3 p-2 m-2 flex flex-col">
                <h2 class="text-2xl font-bold text-center">Analytics</h2>
                <div class="bg-blue-500 rounded-md flex-grow m-2">
                    <!-- First column, first row content -->
                </div>
                <div class="bg-emerald-500 rounded-md flex-grow p-2">
                    <!-- First column, second row content -->
                    <h2>Hello</h2>
                </div>
            </div>

            <!-- Settings Collumn -->
            <div class="rounded-lg border-dashed border-2 h-full md:w-1/3 p-2 m-2">
                <h2 class="text-2xl font-bold text-center">Settings</h2>
                <div class="form-control">
                    <label class="label cursor-pointer">
                        <div class="flex justify-start">
                            <span class="label-text">Light always-on</span>
                            <div class="tooltip px-2" data-tip="This will turn off the motion sensor and leave fridge light on all the time.">
                                <Info size=18/>
                            </div>
                        </div>
                        <input type="radio" name="radio-10" class="radio checked:bg-emerald-500" checked />
                    </label>
                    <label class="label cursor-pointer">
                        <div class="flex justify-start">
                            <span class="label-text">Use motion sensor</span>
                            <div class="tooltip px-2" data-tip="This will turn on the motion sensor to actuate the light efficiently.">
                                <Info size=18/>
                            </div>
                        </div>
                        <input type="radio" name="radio-10" class="radio checked:bg-emerald-500" />
                    </label>
                </div>
            </div>

            <!-- Logs Collumn -->
            <div class="rounded-lg border-dashed border-2 h-full md:w-1/3 p-2 m-2">
                <h2 class="text-2xl font-bold text-center">Logs</h2>
                <!-- Third column content -->
            </div>
        </div>
    </main>
</div>