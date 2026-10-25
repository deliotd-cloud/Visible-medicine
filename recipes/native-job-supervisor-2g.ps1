param([Parameter(Mandatory=$true)][string]$Configuration)
$ErrorActionPreference='Stop'
$c=Get-Content -LiteralPath $Configuration -Raw|ConvertFrom-Json
function Observe-Memory {
 $m=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');availableMiB=[double]$m.AvailableMBytes;commitPercent=[double]$m.PercentCommittedBytesInUse}
}
function Safe-Command([string]$raw,[string]$name) {
 # Emit only reviewed tokens. Raw command lines can contain private arguments.
 $tokens=@($name)
 foreach($entry in @(
  @('scripts[/\\]run-website-tests\.mjs','scripts/run-website-tests.mjs'),
  @('tests[/\\]atlas-current-history-wave4-contract\.test\.mjs','tests/atlas-current-history-wave4-contract.test.mjs'),
  @('--experimental-strip-types','--experimental-strip-types'),
  @('--test-concurrency=1','--test-concurrency=1'),
  @('--test-reporter=tap','--test-reporter=tap'),
  @('(?:^|\s)--test(?:\s|$)','--test'),
  @('(?:^|\s)--run(?:\s|$)','--run'))){
  if($raw -match $entry[0]){$tokens+=$entry[1]}
 }
 if($tokens.Count -eq 1){$tokens+='[arguments redacted]'}
 return ($tokens -join ' ')
}
function Observe-Owned([uint32]$rootPid,[datetime]$started) {
 $all=@(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate,Name,WorkingSetSize,PrivatePageCount,CommandLine)
 $owned=@{}
 $root=@($all | Where-Object {$_.ProcessId -eq $rootPid -and $null -ne $_.CreationDate -and $_.CreationDate.ToUniversalTime() -ge $started.AddSeconds(-2)})
 if($root.Count -ne 1){return @()}
 $owned[[uint32]$rootPid]=$root[0]
 do {
  $added=$false
  foreach($p in $all){
   $id=[uint32]$p.ProcessId;$parent=[uint32]$p.ParentProcessId
   if($owned.ContainsKey($id) -or -not $owned.ContainsKey($parent)){continue}
   if($null -eq $p.CreationDate -or $p.CreationDate.ToUniversalTime() -lt $owned[$parent].CreationDate.ToUniversalTime()){continue}
   $owned[$id]=$p;$added=$true
  }
 } while($added)
 return @($owned.Values | Sort-Object ProcessId | ForEach-Object {
  [pscustomobject]@{pid=[uint32]$_.ProcessId;parentPid=[uint32]$_.ParentProcessId;name=$_.Name;started=$_.CreationDate.ToUniversalTime().ToString('o');workingBytes=[uint64]$_.WorkingSetSize;privateBytes=[uint64]$_.PrivatePageCount;commandLine=(Safe-Command $_.CommandLine $_.Name)}
 })
}
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Text;
using System.Runtime.InteropServices;
public sealed class StockJob : IDisposable {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct SI { public int cb; public string reserved, desktop, title; public int x,y,xSize,ySize,xCount,yCount,fill,flags; public short show,reserved2; public IntPtr reservedPtr,input,output,error; }
 [StructLayout(LayoutKind.Sequential)] struct PI { public IntPtr process,thread; public uint pid,tid; }
 [StructLayout(LayoutKind.Sequential)] struct BASIC { public long processTime,jobTime; public uint flags; public UIntPtr min,max; public uint active; public UIntPtr affinity; public uint priority,scheduling; }
 [StructLayout(LayoutKind.Sequential)] struct IO { public ulong r,w,o,rb,wb,ob; }
 [StructLayout(LayoutKind.Sequential)] struct EXT { public BASIC basic; public IO io; public UIntPtr processMem,jobMem,peakProcess,peakJob; }
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool CreateProcess(string app,StringBuilder cmd,IntPtr pa,IntPtr ta,bool inherit,uint flags,IntPtr env,string cwd,ref SI si,out PI pi);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateFile(string file,uint access,uint share,IntPtr attributes,uint disposition,uint flags,IntPtr template);
 [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr a,string name);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int type,ref EXT data,uint size);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetHandleInformation(IntPtr h,uint mask,uint flags);
 [DllImport("kernel32.dll")] static extern uint ResumeThread(IntPtr h);
 [DllImport("kernel32.dll")] static extern bool TerminateProcess(IntPtr h,uint code);
 [DllImport("kernel32.dll")] static extern bool TerminateJobObject(IntPtr h,uint code);
 [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr h,uint ms);
 [DllImport("kernel32.dll")] static extern bool GetExitCodeProcess(IntPtr h,out uint code);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
 IntPtr job,process,input; FileStream stdout,stderr; public uint Pid {get;private set;}
 static void Check(bool ok) {if(!ok)throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());}
 public StockJob(string exe,string cwd,string environment,string output,string error) {
  PI pi=new PI(); IntPtr block=IntPtr.Zero;
  try {
   job=CreateJobObject(IntPtr.Zero,null);Check(job!=IntPtr.Zero);
   EXT limits=new EXT();limits.basic.flags=0x2000|0x200;limits.jobMem=new UIntPtr(2UL*1024UL*1024UL*1024UL);Check(SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(typeof(EXT))));
   stdout=new FileStream(output,FileMode.CreateNew,FileAccess.Write,FileShare.ReadWrite);stderr=new FileStream(error,FileMode.CreateNew,FileAccess.Write,FileShare.ReadWrite);
   IntPtr oh=stdout.SafeFileHandle.DangerousGetHandle(),eh=stderr.SafeFileHandle.DangerousGetHandle();Check(SetHandleInformation(oh,1,1));Check(SetHandleInformation(eh,1,1));
   SI si=new SI();si.cb=Marshal.SizeOf(typeof(SI));si.flags=0x100;si.output=oh;si.error=eh;input=CreateFile("NUL",0x80000000,3,IntPtr.Zero,3,0,IntPtr.Zero);Check(input!=new IntPtr(-1));Check(SetHandleInformation(input,1,1));si.input=input;
   block=Marshal.StringToHGlobalUni(environment);
   Check(CreateProcess(exe,new StringBuilder("\""+exe+"\" scripts/run-website-tests.mjs --run"),IntPtr.Zero,IntPtr.Zero,true,0x08000404,block,cwd,ref si,out pi));
   process=pi.process;Pid=pi.pid;Check(AssignProcessToJobObject(job,process));
   if(ResumeThread(pi.thread)==0xffffffff)throw new Exception("Cannot resume contained runner");
  } catch {if(pi.process!=IntPtr.Zero)TerminateProcess(pi.process,125);Dispose();throw;}
  finally {if(pi.thread!=IntPtr.Zero)CloseHandle(pi.thread);if(block!=IntPtr.Zero)Marshal.FreeHGlobal(block);}
 }
 public bool Done {get{return WaitForSingleObject(process,0)==0;}}
 public uint ExitCode {get{uint code;Check(GetExitCodeProcess(process,out code));return code;}}
 public void Stop() {Check(TerminateJobObject(job,125));WaitForSingleObject(process,30000);}
 public void Dispose() {if(input!=IntPtr.Zero&&input!=new IntPtr(-1)){CloseHandle(input);input=IntPtr.Zero;}if(job!=IntPtr.Zero){CloseHandle(job);job=IntPtr.Zero;}if(process!=IntPtr.Zero){CloseHandle(process);process=IntPtr.Zero;}if(stdout!=null){stdout.Dispose();stdout=null;}if(stderr!=null){stderr.Dispose();stderr=null;}}
}
"@
$job=$null
$reason=$null
$before=Observe-Memory
$before|ConvertTo-Json -Compress|Set-Content -LiteralPath "$($c.evidence)/MEMORY-BEFORE.json"
if($before.availableMiB -lt 4096 -or $before.commitPercent -gt 90){throw 'Memory preflight refused: require available >=4096 MiB and commit <=90%'}
$block=(@($c.environment.PSObject.Properties|Sort-Object Name|ForEach-Object{"$($_.Name)=$($_.Value)"}) -join [char]0)+[char]0+[char]0
$overlap=@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {$_.CommandLine -match 'run-website-tests\.mjs'})
@{count=$overlap.Count}|ConvertTo-Json|Set-Content -LiteralPath "$($c.evidence)/OVERLAP.json"
if($overlap.Count -gt 0){throw 'An existing stock runner is active; leave it alone and do not launch another'}
$start=[DateTime]::UtcNow
try {
 $job=[StockJob]::new($c.node,$c.site,$block,"$($c.evidence)/runner.stdout.log","$($c.evidence)/runner.stderr.log")
 @{at=$start.ToString('o');supervisorPid=$PID;runnerPid=$job.Pid;command=@('node.exe','scripts/run-website-tests.mjs','--run');jobKillOnClose=$true;jobMemoryMiB=2048;createdSuspendedThenAssigned=$true}|ConvertTo-Json -Depth 4|Set-Content -LiteralPath "$($c.evidence)/STARTED.json"
 while(-not $job.Done){
  $m=Observe-Memory
  $m|ConvertTo-Json -Compress|Add-Content -LiteralPath "$($c.evidence)/memory.jsonl"
  @{at=$m.at;processes=@(Observe-Owned $job.Pid $start)}|ConvertTo-Json -Compress -Depth 5|Add-Content -LiteralPath "$($c.evidence)/owned-processes.jsonl"
  if($m.commitPercent -gt 90 -or $m.availableMiB -lt 2048){$reason='resource-stop';$job.Stop();break}
  if(([DateTime]::UtcNow-$start).TotalMinutes -ge [double]$c.maxMinutes){$reason='case-timeout';$job.Stop();break}
  Start-Sleep -Seconds 1
 }
 @{at=[DateTime]::UtcNow.ToString('o');exitCode=$job.ExitCode;stopReason=$reason;interrupted=($null -ne $reason);terminalObserved=$job.Done;runnerPid=$job.Pid}|ConvertTo-Json|Set-Content -LiteralPath "$($c.evidence)/PROCESS-TERMINAL.json"
} finally {if($null -ne $job){$job.Dispose()}}
