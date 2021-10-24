# CONFIRM
echo ""
echo "----------- [$(date +'%d-%m-%Y %H:%M:%S')] -----------"
echo "Are you sure to build now?"
echo "Press any key to continue (ESC key to quit)..."
echo ""
read -r -n1 key
if [[ $key == $'\e' ]];
then
exit
fi
# remove old _site
rm -rf _site
# build new version
bundle exec jekyll build
# checkout master and get lastest
git checkout master
git pull origin master
# remove old version
find . -maxdepth 1 ! -name '_site' ! -name '.git' ! -name '.gitignore' -exec rm -rf {} \;
# copy new version
mv _site/* .
# rm -rf _site
# commit new version
git add -fA
git commit --allow-empty -m "$(date +'%d%m%Y')"
git push origin master
# checkout develop branch
git checkout develop
# Deployed successfully
echo ""
echo "----------- [$(date +'%d-%m-%Y %H:%M:%S')] Deployed successfully! -----------"
echo "Press any key to checkout [develop] branch and quit..."
read -r -n1 key
exit