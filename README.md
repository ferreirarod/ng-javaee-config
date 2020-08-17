# Angular JavaEE Configurator (ng-javaee-config)
Tool for generating a war bundle of an agular-cli application

 ## How does it works?
  1) Looks for all ts files
  
  2) For each ts file found looks for all "RouterModule.forRoot("
  
  3) Captures all routes or imported route variables
  
  4) Writes the urlrewrite xml file with all the routes found
  
       Asks to override the file (if it already exists)
  
  5) creates a WEB-INF file inside the dist folder with the following structure:
       
       WEB-INF
           urlrewrite.xml
           web.xml
           lib
               urlrewrite.jar

  6) Creates the war file

## How to install?

  npm i --g @ferreirarod/ng-javaee-config

## How to run?

  ng-javaee-config