<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <v-card>
        <v-card-title align="center">
          <img style="display: block; margin-left: auto; margin-right: auto" src="/mysticalwizard-logo.jpg" alt="MysticalWizard" width=128px;>
        </v-card-title>
        <v-card-text align="center">
          <p>
            Hello there! My name is Maring Shin(a.k.a. MysticalWizard) and this is my personal website I made using Nuxtjs. I love programming and I am currently learning C# and PHP. This website is currently working in progress so check back later to see what have changed!
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            nuxt
            to="/"
          >
            Home
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'AboutPage',
}
</script>
