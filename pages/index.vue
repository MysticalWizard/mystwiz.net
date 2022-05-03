<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <div class="middle">
          <h1 class="title" style="font-size: 80px !important;">Mystical<wbr>Wizard</h1>
          <p class="subtitle">Game & Web Developer</p>
          <ul class="links" style="font-size: 25px;">
              <li>
                  <a href="https://osu.ppy.sh/users/19430051/osu/" target="_blank" rel="noopener noreferrer">osu!</a>
              </li>
              <li>
                  <a href="https://steamcommunity.com/id/mysticalwiz/" target="_blank" rel="noopener noreferrer">Steam</a>
              </li>
              <li>
                  <a href="https://www.youtube.com/channel/UCGeXuxX5zk3T9KAhdpqRUfA/" target="_blank" rel="noopener noreferrer">YouTube</a>
              </li>
              <li>
                  <a href="https://www.instagram.com/maring_shin/" target="_blank" rel="noopener noreferrer">Instagram</a>
              </li>
              <li>
                  <a href="https://github.com/mysticalwizard/" target="_blank" rel="noopener noreferrer">GitHub</a>
              </li>
          </ul>
      </div>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'IndexPage',
}
</script>

<style>
.middle {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    align-items: center;
    flex-direction: column;
    color: #fff;
}
.middle,
.middle .links {
    display: flex;
    justify-content: center;
}
.middle .links {
    padding: 0;
    margin: 0px;
    list-style: none;
    flex-wrap: wrap;
    font-size: 18px;
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
.middle .links li {
    display: inline;
    padding: 0 10px;
    font-weight: 300;
}
.middle .links li a {
    color: #bdbdbd;
    text-decoration: none;
    transition-duration: 0.15s;
}
.middle .links li a:hover {
    color: #fff !important;
}
.middle .title {
    color: #fff;
    line-height: 1em;
}
.middle .subtitle,
.middle .title {
    font-weight: 300;
    text-align: center;
}
.middle .subtitle {
    letter-spacing: 4px;
    color: #e2e2e2;
}
</style>
