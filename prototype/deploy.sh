#!/bin/bash
# ./deploy.sh /afs/cs.cmu.edu/user/foliveir/www/prototype
# WARNING: DONT INCLUDE ENDING / OR BAD THINGS HAPPEN
# note sure if deployment may fail due to race on the last command
# (if the file was not yet properly synced/updated in /afs)

if [ -z $1 ]
then
	echo "ERROR: Target directory not set!"
else
	TODAY=`date '+%d.%m.%Y@%H:%M'`
	TARGET=$1
	EDITOR=editor.html
	
	echo "Deploying to: $TARGET on $TODAY"
	
	if [ -d $TARGET ];
	then
		echo "Target directory $TARGET exists."
		echo "Moving old version to: ${TARGET}_pre$TODAY"
		mv $TARGET ${TARGET}_pre$TODAY
		# note it grabs the basename of the TARGET directory
		TODAY="<a href='../`basename ${TARGET}`_pre$TODAY/editor.html' title='previous version'>$TODAY</a>"
		echo $TODAY
	else
		echo "Good, directory $TARGET does not exist yet."
	fi
	
	echo "generating static grammar"
	jison code/grammar.jison
	mv grammar.js code/
	
	# update deploy editor.html
	# update __DEV__ flag to deploy date.
	# remove jison library and use static grammar
	sed s,__DEV__,"$TODAY",g editor-dev.html > $EDITOR
	
	# verbose copy, /afs/ is slow... to make sure it's not dead.
	cp -nRv . $TARGET
	mv $TARGET/code/worker.js $TARGET/code/worker-dev.js
	sed s,//__DEV__,"",g $TARGET/code/worker-dev.js > $TARGET/code/worker.js
	
	echo "Check to see if was properly replaced:"
	grep Version $EDITOR
	# grep "code/" $EDITOR
	
fi


