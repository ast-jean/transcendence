FROM docker.elastic.co/logstash/logstash:8.7.1

COPY ./postgresql-42.6.2.jar /usr/share/logstash/logstash-core/jars/postgresql-42.6.2.jar

COPY ./conf/site_users.conf /usr/share/logstash/pipeline/site_users.conf

COPY ./conf/game_scores.conf /usr/share/logstash/pipeline/game_scores.conf

COPY ./pipelines.yml /usr/share/logstash/config/

CMD ["logstash"]